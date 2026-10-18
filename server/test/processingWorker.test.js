const test = require("node:test");
const assert = require("node:assert/strict");
const { createProcessingWorker } = require("../src/services/processingWorker");

function matches(doc, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === "$and") return value.every((q) => matches(doc, q));
    if (key === "$or") return value.some((q) => matches(doc, q));
    const actual = doc[key];
    if (value && typeof value === "object" && !(value instanceof Date)) {
      return Object.entries(value).every(([op, operand]) => {
        if (op === "$in") return operand.includes(actual);
        if (op === "$ne") return actual !== operand;
        if (op === "$lte") return actual != null && actual <= operand;
        if (op === "$gt") return actual != null && actual > operand;
        throw new Error(`Unexpected operator ${op}`);
      });
    }
    return value === null ? actual == null : actual === value;
  });
}

function harness(overrides = {}) {
  let time = new Date("2026-01-01T00:00:00Z");
  const doc = { _id: "synthetic", status: "pending", processingAttempts: 0, ...overrides };
  const flags = [];
  const calls = { download: 0, ocr: 0, analysis: 0 };
  function update(query, changes) {
    if (!matches(doc, query)) return null;
    Object.assign(doc, changes.$set);
    for (const [key, value] of Object.entries(changes.$inc || {})) doc[key] = (doc[key] || 0) + value;
    return { ...doc };
  }
  const Contract = {
    findOneAndUpdate(query, changes) {
      return { select: async () => update(query, changes), then: (yes, no) => Promise.resolve(update(query, changes)).then(yes, no) };
    },
    updateOne: async (query, changes) => update(query, changes),
    findById: async () => ({ ...doc }),
    startSession: async () => ({
      async withTransaction(fn) {
        const before = structuredClone(doc); const beforeFlags = structuredClone(flags);
        try { await fn(); } catch (error) { Object.assign(doc, before); flags.splice(0, flags.length, ...beforeFlags); throw error; }
      },
      async endSession() {},
    }),
  };
  const dependencies = {
    Contract,
    ContractFlag: {
      exists: (query) => ({ session: async () => flags.some((flag) => matches(flag, query)) }),
      deleteMany: async (query) => { for (let i = flags.length - 1; i >= 0; i--) if (matches(flags[i], query)) flags.splice(i, 1); },
      insertMany: async (values) => { flags.push(...values); },
    },
    now: () => time,
    logger: { error() {} },
    async downloadContract() { calls.download++; return { buffer: Buffer.from("%PDF synthetic"), mimeType: "application/pdf" }; },
    async processContract(_id, _buffer, _mime, job) { calls.ocr++; await job.update({ status: "ai_analysis", rawOcrText: "synthetic" }); },
    async analyzeContract(_id, job) {
      calls.analysis++;
      await job.commitAnalysis([{ contractId: doc._id, clauseIndex: 0, attorneyStatus: "pending" }], { status: "awaiting_attorney_review" });
    },
  };
  return { doc, flags, calls, dependencies, worker: () => createProcessingWorker(dependencies),
    advance: (ms) => { time = new Date(time.getTime() + ms); } };
}

test("persisted pending upload is processed by a new worker without request memory", async () => {
  const h = harness(); await h.worker().runOnce();
  assert.equal(h.doc.status, "awaiting_attorney_review");
  assert.equal(h.doc.processingToken, null); assert.equal(h.flags.length, 1);
  assert.deepEqual(h.calls, { download: 1, ocr: 1, analysis: 1 });
  await h.worker().runOnce(); assert.equal(h.calls.analysis, 1);
});

test("active lease excludes competitors; expired OCR lease resumes after restart", async () => {
  const h = harness({ status: "ocr_processing", processingToken: "dead-worker", processingLeaseUntil: new Date("2026-01-01T00:01:00Z") });
  await h.worker().runOnce(); assert.equal(h.calls.ocr, 0);
  h.advance(61000); await h.worker().runOnce(); assert.equal(h.calls.ocr, 1);
});

test("interrupted analysis resumes without downloading or rerunning OCR", async () => {
  const h = harness({ status: "ai_analysis", rawOcrText: "synthetic" });
  h.flags.push({ contractId: h.doc._id, clauseIndex: 0, attorneyStatus: "pending" });
  await h.worker().runOnce();
  assert.deepEqual(h.calls, { download: 0, ocr: 0, analysis: 1 }); assert.equal(h.flags.length, 1);
});

test("failures back off and route to manual review at the attempt limit", async () => {
  const h = harness(); h.dependencies.downloadContract = async () => { throw new Error("synthetic failure"); };
  const worker = h.worker(); await worker.runOnce();
  assert.equal(h.doc.processingAttempts, 1); assert.equal(h.doc.status, "ocr_processing");
  await worker.runOnce(); assert.equal(h.doc.processingAttempts, 1);
  h.advance(30001); await worker.runOnce(); h.advance(60001); await worker.runOnce();
  assert.equal(h.doc.processingAttempts, 3); assert.equal(h.doc.status, "awaiting_attorney_review");
  assert.equal(h.doc.flaggedForManualReview, true); assert.equal(h.doc.reportReleasedToClient, undefined);
});

test("lost worker cannot commit results or reschedule the new owner's job", async () => {
  const h = harness();
  h.dependencies.processContract = async (_id, _buffer, _mime, job) => {
    h.doc.processingToken = "replacement-worker";
    await job.update({ rawOcrText: "stale result", status: "ai_analysis" });
  };
  await h.worker().runOnce();
  assert.equal(h.doc.processingToken, "replacement-worker"); assert.equal(h.doc.rawOcrText, undefined);
  assert.equal(h.calls.analysis, 0);
});

test("analysis transaction rolls back status and flags on persistence failure", async () => {
  const h = harness({ status: "ai_analysis" });
  h.flags.push({ contractId: h.doc._id, clauseIndex: 0, attorneyStatus: "pending" });
  h.dependencies.ContractFlag.insertMany = async () => { throw new Error("synthetic insert failure"); };
  await h.worker().runOnce();
  assert.equal(h.doc.status, "ai_analysis"); assert.equal(h.flags.length, 1);
});

test("reviewed flags are preserved and released contracts never get claimed", async () => {
  const h = harness({ status: "ai_analysis" });
  h.flags.push({ contractId: h.doc._id, attorneyStatus: "approved", attorneyNote: "synthetic decision" });
  await h.worker().runOnce(); assert.equal(h.flags[0].attorneyNote, "synthetic decision");
  assert.equal(h.doc.status, "ai_analysis");
  h.doc.reportReleasedToClient = true; h.advance(30001); await h.worker().runOnce();
  assert.equal(h.doc.processingAttempts, 1);
});

test("two workers cannot claim the same pending contract simultaneously", async () => {
  const h = harness(); await Promise.all([h.worker().runOnce(), h.worker().runOnce()]);
  assert.equal(h.calls.ocr, 1); assert.equal(h.flags.length, 1);
});

test("restart after repeated crashes stops re-executing exhausted work", async () => {
  const h = harness({ status: "ocr_processing", processingAttempts: 3 });
  await h.worker().runOnce(); assert.equal(h.calls.download, 0);
  assert.equal(h.doc.status, "awaiting_attorney_review");
});

test("hung attempts time out and late OCR results cannot change the retry", async () => {
  const h = harness(); let release; let lateUpdate;
  h.dependencies.attemptTimeoutMs = 10;
  h.dependencies.processContract = async (_id, _buffer, _mime, job) => {
    lateUpdate = job.update;
    await new Promise((resolve) => { release = resolve; });
  };
  await h.worker().runOnce();
  assert.equal(h.doc.processingToken, null); assert.ok(h.doc.processingNextAttemptAt);
  await assert.rejects(lateUpdate({ rawOcrText: "late result" }), /lease lost/);
  release();
  assert.equal(h.doc.rawOcrText, undefined);
});
