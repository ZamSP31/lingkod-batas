const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const express = require("express");
const Source = require("../src/models/StatutorySource");
const userId = "000000000000000000000001";
const seed = { _id: "000000000000000000000002", citation: "Synthetic Art. 1", title: "Synthetic provision",
  sourceType: "labor_code", provisionText: "Synthetic legal provision", tags: ["other"],
  filePublicId: "old-file", fileType: "txt", fileUrl: "https://example.invalid/old.txt" };
const file = { buffer: Buffer.from("Synthetic replacement text"), mimetype: "text/plain", originalname: "synthetic.txt", size: 26 };
function load(relative, deps) {
  const context = { module: { exports: {} }, console: { warn() {} },
    require(name) { if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`); return deps[name]; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", relative), "utf8"), context);
  return context.module.exports;
}
function harness() {
  const state = { stored: null, events: [], failUpload: false, failSave: false, failCleanup: false };
  function Model(values) {
    const doc = new Source(values);
    doc.save = async () => {
      state.events.push("save");
      if (state.failSave) throw new Error("Synthetic database failure");
      state.stored = doc.toObject();
      return doc;
    };
    return doc;
  }
  Model.findOne = async query => state.stored && query.citation === state.stored.citation && !query._id ? new Model(state.stored) : null;
  Model.findById = async () => state.stored ? new Model(state.stored) : null;
  const controller = load("controllers/kbController.js", {
    "express-async-handler": require("express-async-handler"), "../models/StatutorySource": Model,
    "../services/cloudinaryService": {
      uploadToCloudinary: async () => { state.events.push("upload"); if (state.failUpload) throw new Error("SYNTHETIC_STORAGE_SECRET");
        return { url: "https://example.invalid/new.txt", publicId: "new-file" }; },
      deleteFromCloudinary: async (id, type) => { state.events.push(`delete:${id}:${type}`); if (state.failCleanup) throw new Error("cleanup failed"); },
    },
    "../services/ocrService": {}, "../utils/documentLimits": require("../src/utils/documentLimits"),
    "../utils/documentIntegrity": require("../src/utils/documentIntegrity"),
    "../utils/fileValidation": require("../src/utils/fileValidation"),
    "../utils/securityUtils": require("../src/utils/securityUtils"),
    "../services/auditService": { logAction: async () => { state.events.push("audit"); } },
  });
  async function invoke(name, body = {}, attached = file) {
    const req = { body, file: attached, user: { _id: userId }, params: { id: seed._id } };
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; } };
    let error;
    await controller[name](req, res, e => { error = e; });
    return { res, error };
  }
  return { state, controller, invoke };
}
const metadata = { citation: seed.citation, title: seed.title, sourceType: seed.sourceType, tags: '["other"]' };

test("create imports TXT, saves attachment, and rejects duplicate citations", async () => {
  const h = harness();
  const first = await h.invoke("createSource", metadata);
  assert.equal(first.error, undefined); assert.equal(first.res.statusCode, 201);
  assert.equal(h.state.stored.provisionText, file.buffer.toString());
  assert.equal(h.state.stored.filePublicId, "new-file");
  assert.deepEqual(h.state.events, ["upload", "save", "audit"]);
  const duplicate = await h.invoke("createSource", metadata);
  assert.equal(duplicate.res.statusCode, 409); assert.match(duplicate.error.message, /already exists/);
});
test("invalid corpus metadata is rejected before storage", async () => {
  const h = harness();
  const result = await h.invoke("createSource", { ...metadata, sourceType: "unsupported" });
  assert.equal(result.error.name, "ValidationError");
  assert.deepEqual(h.state.events, []);
});
test("create storage failures are visible and database failures clean only the new upload", async () => {
  const h = harness(); h.state.failUpload = true;
  const result = await h.invoke("createSource", metadata);
  assert.equal(result.error.statusCode, 502);
  assert.ok(!result.error.message.includes("SECRET")); assert.equal(h.state.stored, null);
  h.state.failUpload = false; h.state.failSave = true; h.state.events = [];
  assert.match((await h.invoke("createSource", metadata)).error.message, /database failure/);
  assert.deepEqual(h.state.events, ["upload", "save", "delete:new-file:raw"]);
});
test("replacement upload/save failures preserve the previous source and attachment", async () => {
  for (const failure of ["failUpload", "failSave"]) {
    const h = harness(); h.state.stored = { ...seed }; h.state[failure] = true;
    const result = await h.invoke("updateSource", { title: "Changed title" });
    assert.ok(result.error); assert.equal(h.state.stored.title, seed.title);
    assert.equal(h.state.stored.filePublicId, "old-file");
    assert.ok(!h.state.events.includes("delete:old-file:raw"));
    if (failure === "failSave") assert.ok(h.state.events.includes("delete:new-file:raw"));
  }
});
test("replacement cleans old attachment only after successful save", async () => {
  const h = harness(); h.state.stored = { ...seed };
  const result = await h.invoke("updateSource", { title: "Updated title", isActive: "false" });
  assert.equal(result.error, undefined); assert.equal(h.state.stored.isActive, false);
  assert.deepEqual(h.state.events, ["upload", "save", "delete:old-file:raw", "audit"]);
});
test("manual edits and file removal work without replacement; failed removal preserves old file", async () => {
  const h = harness(); h.state.stored = { ...seed }; h.state.failSave = true;
  assert.ok((await h.invoke("updateSource", { removeFile: true }, null)).error);
  assert.equal(h.state.stored.filePublicId, "old-file"); assert.deepEqual(h.state.events, ["save"]);
  h.state.failSave = false; h.state.events = [];
  assert.equal((await h.invoke("updateSource", { removeFile: "true", title: "Edited" }, null)).error, undefined);
  assert.equal(h.state.stored.filePublicId, null); assert.equal(h.state.stored.title, "Edited");
  assert.deepEqual(h.state.events, ["save", "delete:old-file:raw", "audit"]);
});
test("cleanup failure retains the saved replacement and does not report false failure", async () => {
  const h = harness(); h.state.stored = { ...seed }; h.state.failCleanup = true;
  assert.equal((await h.invoke("updateSource", { title: "Edited" })).error, undefined);
  assert.equal(h.state.stored.filePublicId, "new-file");
});
test("actual multipart corpus routes reject corrupted input before persistence and support create/edit", async () => {
  const h = harness();
  const router = load("routes/kbRoutes.js", {
    express, multer: require("multer"), "express-rate-limit": () => (_req, _res, next) => next(),
    "../controllers/kbController": h.controller,
    "../middleware/auth": { protect(req, _res, next) { req.user = { _id: userId, role: "attorney" }; next(); },
      authorize: () => (_req, _res, next) => next() },
    "../middleware/documentAdmission": require("../src/middleware/documentAdmission"),
  });
  const app = express(); app.use("/api/knowledge-base", router);
  app.use(require("../src/middleware/errorHandler").errorHandler);
  const server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  const origin = `http://127.0.0.1:${server.address().port}/api/knowledge-base`;
  const form = (bytes, extra = {}) => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ ...metadata, ...extra })) data.set(key, value);
    data.set("documentFile", new Blob([bytes], { type: "text/plain" }), "synthetic.txt");
    return data;
  };
  try {
    const rejected = await fetch(origin, { method: "POST", body: form(Buffer.from([0xff, 0])) });
    assert.equal(rejected.status, 422); assert.deepEqual(h.state.events, []);
    const created = await fetch(origin, { method: "POST", body: form(file.buffer) });
    assert.equal(created.status, 201);
    const id = (await created.json()).source._id;
    const edited = await fetch(`${origin}/${id}`, { method: "PATCH", body: form(file.buffer, { title: "Edited over HTTP" }) });
    assert.equal(edited.status, 200); assert.equal((await edited.json()).source.title, "Edited over HTTP");
    const extracted = await fetch(`${origin}/extract-text`, { method: "POST", body: form(file.buffer) });
    assert.equal(extracted.status, 200); assert.equal((await extracted.json()).text, file.buffer.toString());
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test("actual contract submission route blocks corrupt PDF before invoking storage flow", { timeout: 20000 }, async () => {
  let submissions = 0;
  const handlers = Object.fromEntries(["getContracts", "getContractById", "getContractReport", "getContractStatus", "downloadDocument"].map(name => [name, (_req, res) => res.json({})]));
  handlers.submitContract = (_req, res) => { submissions++; res.status(201).json({ accepted: true }); };
  const router = load("routes/contractRoutes.js", {
    express, multer: require("multer"), "express-rate-limit": () => (_req, _res, next) => next(),
    "../controllers/contractController": handlers,
    "../middleware/auth": { protect(req, _res, next) { req.user = { _id: userId, role: "client" }; next(); },
      authorize: () => (_req, _res, next) => next() },
    "../middleware/documentAdmission": require("../src/middleware/documentAdmission"),
  });
  const app = express(); app.use("/api/contracts", router);
  app.use(require("../src/middleware/errorHandler").errorHandler);
  const server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  const origin = `http://127.0.0.1:${server.address().port}/api/contracts`;
  async function submit(buffer) {
    const data = new FormData(); data.set("title", "Synthetic contract"); data.set("contractType", "regular");
    data.set("contractFile", new Blob([buffer], { type: "application/pdf" }), "synthetic.pdf");
    return fetch(origin, { method: "POST", body: data });
  }
  try {
    assert.equal((await submit(Buffer.from("%PDF-1.4\n%%EOF"))).status, 422);
    assert.equal(submissions, 0);
    assert.equal((await submit(require("./fixtures/syntheticDocuments.cjs").syntheticPdf())).status, 201);
    assert.equal(submissions, 1);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
