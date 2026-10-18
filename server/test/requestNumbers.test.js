const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const numbers = require("../src/utils/requestNumbers");
const duplicate = (field = "requestNumber") => Object.assign(new Error("Synthetic duplicate"), { code: 11000, keyPattern: { [field]: 1 } });
function allocation({ existing = [], seq = null, initializationFailures = [] } = {}) {
  const state = { existing: [...existing], seq, reads: 0, writes: [] };
  const Contract = { aggregate: async pipeline => {
    state.reads++;
    assert.equal(pipeline[1].$project.sequence.$convert.to, "double");
    const pattern = new RegExp(pipeline[0].$match.requestNumber.$regex);
    const values = state.existing.filter(value => pattern.test(value)).map(value => Number(value.split("-")[2]));
    return values.length ? [{ sequence: Math.max(...values) }] : [];
  } };
  const Counter = { findByIdAndUpdate: async (id, update, options) => {
    state.writes.push({ id, update, options });
    if (update.$max) {
      if (initializationFailures.length) throw initializationFailures.shift();
      assert.equal(options.setDefaultsOnInsert, false);
      state.seq = Math.max(state.seq ?? 0, update.$max.seq);
    } else { assert.equal(update.$inc.seq, 1); state.seq++; }
    return { seq: state.seq };
  } };
  return { state, Contract, Counter, allocate: year => numbers.allocateContractRequestNumber(Contract, Counter, year) };
}

test("missing, stale and ahead counters allocate beyond existing numeric sequences", async () => {
  for (const [seq, expected] of [[null, 56], [2, 56], [99, 100]]) {
    const h = allocation({ seq, existing: ["LB-2026-0055", "LB-2025-9999", "LB-2026-invalid"] });
    assert.equal(await h.allocate(2026), `LB-2026-${String(expected).padStart(4, "0")}`);
    assert.deepEqual(h.state.existing, ["LB-2026-0055", "LB-2025-9999", "LB-2026-invalid"]);
  }
  assert.equal(await allocation().allocate(2026), "LB-2026-0001");
});
test("numeric allocation remains correct above 9999", async () => {
  assert.equal(await allocation({ existing: ["LB-2026-9999", "LB-2026-10000"] }).allocate(2026), "LB-2026-10001");
});
test("concurrent allocations never lower the counter or return duplicate numbers", async () => {
  const h = allocation({ seq: 1, existing: ["LB-2026-0123"] });
  const assigned = await Promise.all(Array.from({ length: 100 }, () => h.allocate(2026)));
  assert.equal(new Set(assigned).size, 100);
  assert.equal(Math.min(...assigned.map(value => Number(value.split("-")[2]))), 124);
  assert.equal(h.state.seq, 223);
});
test("first-counter creation races retry only counter primary-key collisions", async () => {
  const h = allocation({ initializationFailures: [duplicate("_id"), duplicate("_id")] });
  assert.equal(await h.allocate(2026), "LB-2026-0001");
  const original = duplicate("other"); const failure = allocation({ initializationFailures: [original] });
  await assert.rejects(failure.allocate(2026), error => error === original);
  assert.equal(failure.state.writes.length, 1);
});
test("year rollover uses Philippine calendar time and independently filters each year", async () => {
  assert.equal(numbers.requestNumberYear(new Date("2026-12-31T15:59:59Z")), 2026);
  assert.equal(numbers.requestNumberYear(new Date("2026-12-31T16:00:00Z")), 2027);
  const h = allocation({ existing: ["LB-2026-9999", "LB-2027-0002"] });
  assert.equal(await h.allocate(2027), "LB-2027-0003");
  assert.ok(h.state.writes.every(write => write.id === "contract_2027"));
});
test("unsupported sequence ranges fail before changing the counter", async () => {
  const h = allocation({ existing: [`LB-2026-${Number.MAX_SAFE_INTEGER}`] });
  await assert.rejects(h.allocate(2026), /supported range/); assert.equal(h.state.writes.length, 0);
});
test("unrelated or unidentifiable duplicates and edits to persisted contracts are never retried", async () => {
  for (const error of [duplicate("email"), Object.assign(new Error("requestNumber_1"), { code: 11000 }), new Error("Synthetic network failure")]) {
    let attempts = 0;
    const contract = { isNew: true, requestNumber: "unchanged", save: async () => { attempts++; throw error; } };
    await assert.rejects(numbers.saveContractWithRequestNumberRetry(contract), value => value === error);
    assert.equal(attempts, 1); assert.equal(contract.requestNumber, "unchanged");
  }
  let attempts = 0;
  const contract = { isNew: false, requestNumber: "existing", save: async () => { attempts++; throw duplicate(); } };
  await assert.rejects(numbers.saveContractWithRequestNumberRetry(contract)); assert.equal(attempts, 1); assert.equal(contract.requestNumber, "existing");
});
test("duplicate metadata can identify the requestNumber through keyValue", async () => {
  let attempts = 0;
  const contract = { isNew: true, requestNumber: "old", save: async () => {
    if (++attempts === 1) throw Object.assign(new Error("Synthetic duplicate"), { code: 11000, keyPattern: {}, keyValue: { requestNumber: "old" } });
    assert.equal(contract.requestNumber, undefined);
  } };
  await numbers.saveContractWithRequestNumberRetry(contract); assert.equal(attempts, 2);
});

function load(file, deps) {
  const context = { module: { exports: {} }, console: { log() {}, warn() {}, error() {} }, require(name) {
    if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`); return deps[name];
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"), context);
  return context.module.exports;
}
function submission(errors = []) {
  const h = allocation(); const events = []; let hook; let attempts = 0; let persisted = 0;
  class Model {
    constructor(values) { Object.assign(this, values); this._id = "synthetic-contract"; this.isNew = true; }
    static aggregate(pipeline) { return h.Contract.aggregate(pipeline); }
    async save() {
      attempts++;
      await new Promise((resolve, reject) => hook.call(this, error => error ? reject(error) : resolve()));
      if (errors.length) { const error = errors.shift(); if (error) { h.state.existing.push(this.requestNumber); throw error; } }
      assert.ok(!h.state.existing.includes(this.requestNumber));
      h.state.existing.push(this.requestNumber); this.isNew = false; persisted++;
    }
  }
  class Schema { static Types = { ObjectId: String }; virtual() { return { get() {} }; } index() {} pre(_event, fn) { hook = fn; } }
  load("models/Contract.js", { mongoose: { Schema, model: () => Model }, "./Counter": h.Counter, "../utils/requestNumbers": numbers });
  let response;
  const controller = load("controllers/contractController.js", {
    "express-async-handler": fn => fn, "../models/Contract": Model, "../services/contractAccess": {},
    "../utils/documentLimits": require("../src/utils/documentLimits"), "../utils/fileValidation": { isValidDocumentBuffer: () => true },
    "../utils/requestNumbers": numbers,
    "../services/cloudinaryService": { uploadToCloudinary: async () => { events.push("upload"); return { url: "https://example.invalid/synthetic.pdf", publicId: "synthetic-file", deliveryType: "authenticated" }; },
      deleteFromCloudinary: async (_id, type, delivery) => { assert.equal(type, "raw"); assert.equal(delivery, "authenticated"); events.push("cleanup"); } },
    "../services/auditService": { logAction: async () => { events.push("audit"); } },
    "../services/notificationService": { createNotification: async () => { events.push("client-notification"); }, notifyAttorneys: async () => { events.push("attorney-notification"); } },
  });
  return { events, get attempts() { return attempts; }, get persisted() { return persisted; }, get response() { return response; },
    invoke: () => controller.submitContract({ body: { title: "Synthetic contract", contractType: "regular" }, user: { _id: "synthetic-client" },
      file: { buffer: Buffer.from("%PDF synthetic"), mimetype: "application/pdf", originalname: "synthetic.pdf", size: 14 } },
    { status(code) { assert.equal(code, 201); return this; }, json(value) { response = value; } }) };
}
test("real save hook and submission retry reuse one upload and emit success events once", async () => {
  const h = submission([duplicate(), duplicate()]); await h.invoke();
  assert.equal(h.attempts, 3); assert.equal(h.persisted, 1);
  assert.deepEqual(h.events, ["upload", "audit", "client-notification", "attorney-notification"]);
  assert.ok(h.response.contract.requestNumber.endsWith("0003"));
});
test("request-number retry exhaustion cleans the upload and emits no success events", async () => {
  const h = submission([duplicate(), duplicate(), duplicate()]);
  await assert.rejects(h.invoke(), { statusCode: 503 }); assert.equal(h.attempts, 3); assert.equal(h.persisted, 0);
  assert.deepEqual(h.events, ["upload", "cleanup"]);
});
test("unrelated database failure performs one save and cleans the upload", async () => {
  const error = duplicate("email"); const h = submission([error]);
  await assert.rejects(h.invoke(), value => value === error); assert.equal(h.attempts, 1);
  assert.deepEqual(h.events, ["upload", "cleanup"]);
});

test("actual Mongoose save lifecycle regenerates the number after a duplicate insert", async () => {
  const Contract = require("../src/models/Contract");
  const Counter = require("../src/models/Counter");
  const originalAggregate = Contract.aggregate;
  const originalCounter = Counter.findByIdAndUpdate;
  const originalInsert = Contract.collection.insertOne;
  let sequence = 0; let inserts = 0; const attempted = [];
  Contract.aggregate = async () => [];
  Counter.findByIdAndUpdate = async (_id, update) => {
    if (update.$max) sequence = Math.max(sequence, update.$max.seq);
    else sequence++;
    return { seq: sequence };
  };
  Contract.collection.insertOne = async values => {
    inserts++; attempted.push(values.requestNumber);
    if (inserts === 1) throw duplicate();
    return { acknowledged: true, insertedId: values._id };
  };
  try {
    const doc = new Contract({ clientId: "000000000000000000000001", title: "Synthetic lifecycle test", contractType: "regular",
      cloudinaryUrl: "https://example.invalid/synthetic.pdf", cloudinaryPublicId: "synthetic", fileName: "synthetic.pdf", fileType: "pdf", fileSize: 50 });
    await numbers.saveContractWithRequestNumberRetry(doc);
    assert.equal(inserts, 2); assert.notEqual(attempted[0], attempted[1]);
    assert.equal(doc.isNew, false); assert.equal(doc.requestNumber, attempted[1]);
  } finally {
    Contract.aggregate = originalAggregate; Counter.findByIdAndUpdate = originalCounter; Contract.collection.insertOne = originalInsert;
  }
});
