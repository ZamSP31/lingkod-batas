const test = require("node:test");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const { validateDocument } = require("../src/services/documentProcessingService");
const { validateTextFile } = require("../src/utils/documentIntegrity");
const { validateDocumentUpload } = require("../src/middleware/documentAdmission");
const { syntheticPdf } = require("./fixtures/syntheticDocuments.cjs");
const { createCanvas } = createRequire(require.resolve("pdf-parse"))("@napi-rs/canvas");
const canvas = createCanvas(4, 4);
canvas.getContext("2d").fillRect(0, 0, 4, 4);
const png = canvas.toBuffer("image/png");
const jpeg = canvas.toBuffer("image/jpeg");

test("real bounded worker accepts complete synthetic PDF, PNG and JPEG", { timeout: 30000 }, async () => {
  for (const [buffer, mime] of [[syntheticPdf(), "application/pdf"], [png, "image/png"], [jpeg, "image/jpeg"]]) {
    const result = await validateDocument(buffer, mime);
    assert.equal(result.method, "direct");
  }
});
test("real bounded worker rejects signature-only and truncated PDF/image uploads", { timeout: 30000 }, async () => {
  const damaged = Buffer.from(png); damaged[damaged.length - 5] ^= 1;
  for (const [buffer, mime] of [[Buffer.from("%PDF-1.4\n%%EOF"), "application/pdf"],
    [syntheticPdf().subarray(0, -12), "application/pdf"], [png.subarray(0, -12), "image/png"],
    [damaged, "image/png"], [jpeg.subarray(0, -2), "image/jpeg"]]) {
    await assert.rejects(validateDocument(buffer, mime), { statusCode: 422 });
  }
});
test("PDF page and image dimension ceilings still apply", { timeout: 30000 }, async () => {
  await assert.rejects(validateDocument(syntheticPdf(51), "application/pdf"), { statusCode: 422 });
  const giant = Buffer.from(png); giant.writeUInt32BE(13000, 16);
  await assert.rejects(validateDocument(giant, "image/png"), /dimension limit/);
});
test("TXT validation checks UTF-8 and binary controls throughout the entire file", async () => {
  assert.equal(validateTextFile(Buffer.from("Synthetic batas: karapatan ng manggagawa. ?")), "Synthetic batas: karapatan ng manggagawa. ?");
  for (const buffer of [Buffer.alloc(0), Buffer.from("   "), Buffer.from([0xff, 0xfe]),
    Buffer.concat([Buffer.from("x".repeat(2048)), Buffer.from([0])]), Buffer.from("x".repeat(250001))]) {
    assert.throws(() => validateTextFile(buffer), { statusCode: 422 });
  }
  await validateDocument(Buffer.from("Synthetic legal provision"), "text/plain");
});
test("upload gate rejects corrupt files before downstream storage/controllers", async () => {
  let error; let calls = 0;
  await validateDocumentUpload({ file: { buffer: png.subarray(0, -12), mimetype: "image/png" } }, {}, e => { error = e; if (!e) calls++; });
  assert.equal(error.statusCode, 422); assert.equal(calls, 0);
  await validateDocumentUpload({}, {}, e => { if (!e) calls++; });
  assert.equal(calls, 1);
});

test("password-protected PDF returns a distinct safe error", { timeout: 20000 }, async () => {
  await assert.rejects(validateDocument(syntheticPdf(1, true), "application/pdf"), /Password-protected/);
});
