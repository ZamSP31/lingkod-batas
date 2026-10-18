const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function load(relative, dependencies, extra = {}) {
  const context = { module: { exports: {} }, Buffer, URL, AbortSignal, fetch,
    __dirname: path.dirname(path.join(__dirname, "../src", relative)),
    process: { env: { CLOUDINARY_CLOUD_NAME: "synthetic" } }, console: { log() {}, error() {}, warn() {} },
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      if (name.startsWith("node:")) return require(name);
      throw new Error(`Unexpected dependency: ${name}`);
    }, ...extra };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", relative), "utf8"), context);
  return context.module.exports;
}

function storage() {
  const uploads = []; const signed = []; const deleted = []; let destroys = 0;
  const service = load("services/cloudinaryService.js", {
    cloudinary: { v2: { config() {}, utils: { private_download_url(publicId, format, options) {
      signed.push({ publicId, format, options });
      return `https://api.cloudinary.com/v1_1/synthetic/${options.resource_type}/download?signature=synthetic`;
    } }, uploader: {
      upload_stream(options, callback) { uploads.push(options); callback(null, { secure_url: "https://res.cloudinary.com/synthetic/raw/upload/sample.pdf", public_id: options.public_id }); return {}; },
      async destroy(publicId, options) { destroys++; deleted.push({ publicId, options }); },
    } } },
    streamifier: { createReadStream: () => ({ pipe() {} }) },
    "../utils/documentLimits": require("../src/utils/documentLimits"),
    "../services/contractAccess": require("../src/services/contractAccess"),
    "../utils/fileValidation": require("../src/utils/fileValidation"),
  });
  return { service, uploads, signed, deleted, destroys: () => destroys };
}
const document = { cloudinaryUrl: "https://res.cloudinary.com/synthetic/raw/upload/sample.pdf", fileType: "pdf" };

test("same-name simultaneous uploads use distinct storage IDs without overwrites", async () => {
  const h = storage();
  const results = await Promise.all(Array.from({ length: 50 }, () => h.service.uploadToCloudinary(Buffer.from("%PDF"), "sample.pdf", "application/pdf")));
  assert.equal(new Set(results.map((r) => r.publicId)).size, 50);
  assert.ok(h.uploads.every((options) => options.overwrite === false));
  assert.ok(h.uploads.every((options) => options.type === "authenticated" && !options.public_id.includes("sample")));
});

test("statutory archives preserve their existing delivery type while contracts become authenticated", async () => {
  const h = storage();
  const uploaded = await h.service.uploadToCloudinary(Buffer.from("%PDF"), "sample.pdf", "application/pdf");
  assert.equal(uploaded.deliveryType, "authenticated");
  await h.service.uploadToCloudinary(Buffer.from("%PDF"), "sample.pdf", "application/pdf", "lingkod-batas/statutory");
  assert.equal(h.uploads[1].type, "upload");
});

test("private recovery uses short-lived server-side signatures and never returns a URL", async () => {
  const h = storage(); let destination;
  const result = await h.service.downloadContract({ ...document, cloudinaryPublicId: "synthetic.pdf", cloudinaryDeliveryType: "authenticated" }, {
    fetchImpl: async (url, options) => { destination = url; assert.equal(options.redirect, "error"); return new Response("%PDF synthetic"); },
  });
  assert.ok(destination.startsWith("https://api.cloudinary.com/v1_1/synthetic/raw/download"));
  assert.equal(h.signed[0].options.type, "authenticated");
  assert.ok(h.signed[0].options.expires_at <= Math.floor(Date.now() / 1000) + 120);
  assert.ok(h.signed[0].options.expires_at > Math.floor(Date.now() / 1000));
  assert.equal(result.url, undefined); assert.equal(result.buffer.toString(), "%PDF synthetic");
});

test("cleanup targets the stored delivery type and invalidates cached copies", async () => {
  const h = storage();
  await h.service.deleteFromCloudinary("synthetic.pdf", "raw", "authenticated");
  await h.service.deleteFromCloudinary("legacy.pdf", "raw");
  assert.equal(h.deleted[0].options.type, "authenticated"); assert.equal(h.deleted[0].options.invalidate, true);
  assert.equal(h.deleted[1].options.type, "upload");
});

test("recovery download validates account, host, protocol and credentials before fetching", async () => {
  const h = storage(); let calls = 0;
  for (const url of ["http://res.cloudinary.com/synthetic/raw/x", "https://example.invalid/x",
    "https://res.cloudinary.com/other/raw/x", "https://user:password@res.cloudinary.com/synthetic/raw/x",
    "https://res.cloudinary.com:8443/synthetic/raw/x"]) {
    await assert.rejects(h.service.downloadContract({ ...document, cloudinaryUrl: url }, { fetchImpl: async () => { calls++; } }), /Invalid document storage/);
  }
  assert.equal(calls, 0);
});

test("recovery download disables redirects and validates binary content", async () => {
  const h = storage();
  const result = await h.service.downloadContract(document, { fetchImpl: async (_url, options) => {
    assert.equal(options.redirect, "error"); assert.ok(options.signal);
    return new Response(Buffer.from("%PDF synthetic"));
  } });
  assert.equal(result.mimeType, "application/pdf"); assert.equal(result.buffer.toString(), "%PDF synthetic");
  await assert.rejects(h.service.downloadContract(document, { fetchImpl: async () => new Response("invalid") }), /signature/);
  await assert.rejects(h.service.downloadContract(document, { fetchImpl: async () => new Response("missing", { status: 404 }) }), /unavailable/);
});

test("download rejects both declared and streamed oversized documents", async () => {
  const h = storage();
  await assert.rejects(h.service.downloadContract(document, { fetchImpl: async () => new Response("%PDF", { headers: { "content-length": "20971521" } }) }), /size limit/);
  await assert.rejects(h.service.downloadContract(document, { fetchImpl: async () => new Response(Buffer.alloc(20 * 1024 * 1024 + 1)) }), /size limit/);
});

function submission({ saveFails = false, notificationFails = false } = {}) {
  let deleted = 0; let saved = 0; let response;
  const service = load("controllers/contractController.js", {
    "express-async-handler": (fn) => fn,
    "../models/Contract": class {
      constructor(values) { Object.assign(this, values); this._id = "synthetic"; }
      async save() { if (saveFails) throw new Error("synthetic save failure"); saved++; }
    },
    "../services/cloudinaryService": {
      uploadToCloudinary: async () => ({ url: document.cloudinaryUrl, publicId: "synthetic" }),
      deleteFromCloudinary: async () => { deleted++; },
    },
    "../utils/documentLimits": require("../src/utils/documentLimits"),
    "../utils/requestNumbers": require("../src/utils/requestNumbers"),
    "../services/contractAccess": require("../src/services/contractAccess"),
    "../utils/fileValidation": require("../src/utils/fileValidation"),
    "../services/auditService": { logAction: async () => { if (notificationFails) throw new Error("synthetic audit failure"); } },
    "../services/notificationService": {
      createNotification: async () => { if (notificationFails) throw new Error("synthetic notification failure"); },
      notifyAttorneys: async () => { if (notificationFails) throw new Error("synthetic notification failure"); },
    },
  }, { setImmediate() { throw new Error("Unexpected in-memory job"); } });
  return { invoke: () => service.submitContract({ body: { title: "Synthetic", contractType: "regular" },
    user: { _id: "synthetic-client" }, file: { buffer: Buffer.from("%PDF synthetic"), mimetype: "application/pdf", originalname: "sample.pdf", size: 14 } },
  { status(code) { assert.equal(code, 201); return this; }, json(value) { response = value; } }),
  state: () => ({ saved, deleted, response }) };
}

test("accepted upload stays persisted and retains its file when audit/notifications fail", async () => {
  const h = submission({ notificationFails: true }); await h.invoke();
  assert.equal(h.state().saved, 1); assert.equal(h.state().deleted, 0);
  assert.equal(h.state().response.contract.status, "pending");
});

test("database save failure still cleans up the orphaned upload", async () => {
  const h = submission({ saveFails: true }); await assert.rejects(h.invoke(), /save failure/);
  assert.equal(h.state().saved, 0); assert.equal(h.state().deleted, 1);
});

test("actual OCR service uses guarded persistence, masks PII and launches no background analysis", async () => {
  let persisted;
  const text = "Employee: Juan Dela Cruz\nEmail: juan@example.invalid\n" + "Synthetic contract clause text. ".repeat(4);
  const ocr = load("services/ocrService.js", {
    "./documentProcessingService": { processDocument: async () => ({ text, method: "direct", confidence: null, flaggedForReview: false }) },
    "fs/promises": {}, path, crypto: require("node:crypto"),
    "pdf-parse": { PDFParse: class { async getText() { return { text }; } } },
    "../utils/pdfRasterizer": {}, "tesseract.js": {},
    "../models/Contract": { findByIdAndUpdate() { throw new Error("Unguarded persistence"); } },
    "../utils/piiSanitizer": require("../src/utils/piiSanitizer"),
    "./auditService": { logAction: async () => {} },
  }, { setImmediate() { throw new Error("Unexpected background task"); } });
  await ocr.processContract("synthetic", Buffer.from("%PDF"), "application/pdf", { update: async (fields) => { persisted = fields; return {}; } });
  assert.equal(persisted.status, "ai_analysis");
  assert.ok(persisted.rawOcrText.includes("[REDACTED_EMAIL]"));
  assert.ok(!persisted.rawOcrText.includes("juan@example.invalid"));
  await assert.rejects(ocr.processContract("synthetic", Buffer.from("%PDF"), "application/pdf", { update: async () => { throw new Error("Processing lease lost"); } }), /lease lost/);
});

test("actual analysis service sends flags and status through the worker commit boundary", async () => {
  let committed;
  const rag = load("services/ragService.js", {
    "../models/Contract": { findById: async () => ({ _id: "synthetic", rawOcrText: "Synthetic clause" }),
      findByIdAndUpdate() { throw new Error("Unguarded persistence"); } },
    "../models/ContractFlag": { deleteMany() { throw new Error("Unguarded delete"); }, insertMany() { throw new Error("Unguarded insert"); } },
    "../models/StatutorySource": { find: () => ({ limit: async () => [] }) },
    "./clauseSegmenter": { segmentContractText: () => [{ clauseText: "Synthetic clause", clauseIndex: 0, category: "other" }] },
    "./auditService": { logAction: async () => {} },
    "./notificationService": { createNotification: async () => {}, notifyAttorneys: async () => {} },
  });
  await rag.analyzeContract("synthetic", { commitAnalysis: async (flags, fields) => { committed = { flags, fields }; } });
  assert.equal(committed.flags.length, 1); assert.equal(committed.fields.status, "awaiting_attorney_review");
  await assert.rejects(rag.analyzeContract("synthetic", { commitAnalysis: async () => { throw new Error("Processing lease lost"); } }), /lease lost/);
});

test("request number hook keeps atomic counter allocation and preserves assigned numbers", async () => {
  let hook; let increments = 0;
  const Model = { aggregate: async () => [] };
  class Schema { static Types = { ObjectId: String }; virtual() { return { get() {} }; } index() {} pre(_event, fn) { hook = fn; } }
  load("models/Contract.js", {
    mongoose: { Schema, model: () => Model },
    "../utils/requestNumbers": require("../src/utils/requestNumbers"),
    "./Counter": { async findByIdAndUpdate(_id, update, options) {
      assert.equal(options.new, true);
      if (update.$max) { assert.equal(options.upsert, true); return { seq: increments }; }
      assert.equal(update.$inc.seq, 1);
      return { seq: ++increments };
    } },
  });
  const docs = Array.from({ length: 20 }, () => ({ constructor: Model }));
  await Promise.all(docs.map((doc) => new Promise((resolve, reject) => hook.call(doc, (err) => err ? reject(err) : resolve()))));
  assert.equal(new Set(docs.map((doc) => doc.requestNumber)).size, 20);
  await new Promise((resolve) => hook.call(docs[0], resolve)); assert.equal(increments, 20);
});
