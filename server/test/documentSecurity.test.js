const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const limits = require('../src/utils/documentLimits');
const { createDocumentRunner } = require('../src/services/documentProcessingService');
const { createAdmission } = require('../src/middleware/documentAdmission');
const { createHarness, fixture } = require('./helpers/isolatedHarness');

const pdf = Buffer.from('%PDF synthetic');
const result = { text: 'Synthetic text', method: 'direct', confidence: null, flaggedForReview: false };
function runnerHarness({ mode = 'success', ...overrides } = {}) {
  const events = []; let options; let child;
  const root = path.resolve(__dirname, '../tmp/synthetic-processor');
  const run = createDocumentRunner({ root, timeoutMs: 15, ensureRoot: async () => {},
    makeDir: async () => path.join(root, 'job-synthetic'),
    removeDir: async () => { events.push('cleanup'); },
    forkImpl(_file, _args, opts) {
      options = opts; events.push('fork'); child = new EventEmitter(); child.pid = 12345;
      child.send = (_message, callback) => {
        callback?.();
        if (mode === 'success') queueMicrotask(() => child.emit('message', { ok: true, result }));
        if (mode === 'invalid') queueMicrotask(() => child.emit('message', { ok: true, result: { ...result, text: 'x'.repeat(limits.MAX_TEXT + 1) } }));
        if (mode === 'failure') queueMicrotask(() => child.emit('message', { ok: false }));
      };
      return child;
    },
    killTree: async (target) => { events.push('kill-tree'); target.emit('close', 0); }, ...overrides });
  return { run, events, options: () => options, child: () => child };
}

function png(width, height) {
  const buffer = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buffer);
  buffer.writeUInt32BE(13, 8); buffer.write('IHDR', 12); buffer.writeUInt32BE(width, 16); buffer.writeUInt32BE(height, 20);
  return buffer;
}

test('image dimensions and pixel area are checked before starting any processor', async () => {
  const h = runnerHarness();
  await assert.rejects(h.run(png(10000, 10000), 'image/png'), /20-megapixel/);
  await assert.rejects(h.run(png(12001, 1), 'image/png'), /dimension/);
  assert.equal(h.events.length, 0);
  assert.deepEqual(limits.validateImage(png(100, 100)), { width: 100, height: 100 });
});

test('JPEG dimensions, malformed image headers and excessive PDF/text counts are rejected', () => {
  const jpeg = Buffer.from([255,216,255,192,0,11,8,0,100,0,100,1,1,17,0]);
  assert.deepEqual(limits.validateImage(jpeg), { width: 100, height: 100 });
  jpeg.writeUInt16BE(20000, 9); assert.throws(() => limits.validateImage(jpeg), /dimension/);
  assert.throws(() => limits.validateImage(Buffer.from([255,216,0,0])), /header/);
  assert.throws(() => limits.validateInput(Buffer.alloc(20 * 1024 * 1024 + 1), 'application/pdf'), /20MB/);
  assert.throws(() => limits.validatePages(51), /50 pages/);
  assert.throws(() => limits.validatePages(0), /50 pages/);
  assert.throws(() => limits.validateText('x'.repeat(limits.MAX_TEXT + 1)), /text exceeds/);
});

test('successful extraction uses an isolated child, excludes secrets, kills the tree and cleans scratch', async () => {
  const h = runnerHarness(); assert.deepEqual(await h.run(pdf, 'application/pdf'), result);
  assert.deepEqual(h.events, ['fork', 'kill-tree', 'cleanup']);
  assert.equal('JWT_SECRET' in h.options().env, false); assert.equal('MONGO_URI' in h.options().env, false);
  assert.equal('CLOUDINARY_API_SECRET' in h.options().env, false);
  assert.deepEqual(h.options().execArgv, ['--max-old-space-size=256']);
  assert.equal(h.options().windowsHide, true);
});

test('hung extraction kills its process tree before cleanup and rejects on timeout', async () => {
  const h = runnerHarness({ mode: 'hang' });
  await assert.rejects(h.run(pdf, 'application/pdf'), /two-minute/);
  assert.deepEqual(h.events, ['fork', 'kill-tree', 'cleanup']);
});

test('external cancellation terminates active OCR and releases its capacity', async () => {
  const h = runnerHarness({ mode: 'hang', maxActive: 1 }); const controller = new AbortController();
  const processing = h.run(pdf, 'application/pdf', { signal: controller.signal });
  await assert.rejects(h.run(pdf, 'application/pdf'), /busy/);
  controller.abort(); await assert.rejects(processing, /cancelled/);
  assert.equal(h.events.includes('kill-tree'), true); assert.equal(h.events.includes('cleanup'), true);
});

test('unsafe processor output and processor failure both terminate and clean up', async () => {
  for (const mode of ['invalid', 'failure']) {
    const h = runnerHarness({ mode }); await assert.rejects(h.run(pdf, 'application/pdf'));
    assert.deepEqual(h.events, ['fork', 'kill-tree', 'cleanup']);
  }
});

test('failed process termination fails closed and does not delete a possibly active directory', async () => {
  const h = runnerHarness({ killTree: async () => { throw new Error('synthetic kill failure'); } });
  await assert.rejects(h.run(pdf, 'application/pdf'), /could not be stopped/);
  assert.equal(h.events.includes('cleanup'), false);
  await assert.rejects(h.run(pdf, 'application/pdf'), /busy/);
});

test('PDF page ceiling applies before text extraction and parser cleanup runs on rejection', async () => {
  let texts = 0; let destroyed = 0;
  const context = { module: { exports: {} }, __dirname, process: { env: {} },
    require(name) {
      if (name === 'pdf-parse') return { PDFParse: class { async getInfo() { return { total: 51 }; } async getText() { texts++; return { text: 'synthetic' }; } async destroy() { destroyed++; } } };
      if (name === '../utils/documentLimits') return limits;
      if (name === '../utils/pdfRasterizer' || name === 'tesseract.js') return {};
      if (['fs/promises', 'path', 'crypto'].includes(name)) return require(name);
      throw new Error(`ISOLATION VIOLATION: ${name}`);
    } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/services/documentProcessor.js'), 'utf8'), context);
  await assert.rejects(context.module.exports.processDocument(pdf), /50 pages/);
  assert.equal(texts, 0); assert.equal(destroyed, 1);
});

test('upload admission slots are bounded and released exactly once on disconnect/finish', () => {
  const gate = createAdmission(1); let accepted = 0; let rejected = 0;
  function response() { const res = new EventEmitter(); res.status = (code) => { assert.equal(code, 503); rejected++; return res; }; res.json = () => {}; return res; }
  const first = response(); gate({}, first, () => accepted++);
  gate({}, response(), () => accepted++); assert.equal(accepted, 1); assert.equal(rejected, 1);
  first.emit('close'); first.emit('finish');
  gate({}, response(), () => accepted++); assert.equal(accepted, 2);
  gate({}, response(), () => accepted++); assert.equal(accepted, 2);
});

test('original document download requires ownership or attorney assignment before storage access', async () => {
  const h = createHarness(); let downloads = 0;
  const controller = h.load('controllers/contractController.js', { '../services/cloudinaryService': {
    downloadContract: async () => { downloads++; return { buffer: pdf, mimeType: 'application/pdf' }; },
  } });
  for (const user of [{ _id: 'client-b', role: 'client' }, { _id: 'attorney-b', role: 'attorney' }]) {
    assert.equal((await h.invoke(controller.downloadDocument, { user })).statusCode, 403);
  }
  assert.equal(downloads, 0);
  for (const user of [{ _id: 'client-a', role: 'client' }, { _id: 'attorney-a', role: 'attorney' }]) {
    const response = await h.invoke(controller.downloadDocument, { user });
    assert.equal(response.statusCode, 200); assert.ok(Buffer.isBuffer(response.payload));
    assert.equal(response.headers['Cache-Control'], 'no-store, private');
    assert.equal(response.headers['X-Content-Type-Options'], 'nosniff');
    assert.match(response.headers['Content-Disposition'], /^attachment;/);
  }
});

test('download errors do not expose upstream signed URLs or credentials', async () => {
  const h = createHarness();
  const controller = h.load('controllers/contractController.js', { '../services/cloudinaryService': {
    downloadContract: async () => { throw new Error('SYNTHETIC_SIGNED_URL_AND_CREDENTIALS'); },
  } });
  const response = await h.invoke(controller.downloadDocument);
  assert.equal(response.statusCode, 502); assert.ok(!response.error.message.includes('CREDENTIALS'));
});

test('attorney metadata does not expose direct legacy storage URLs', async () => {
  const h = createHarness({ contracts: [fixture({ status: 'completed', reportReleasedToClient: true })] });
  const controller = h.load('controllers/contractController.js');
  for (const handler of ['getContractById', 'getContractReport']) {
    const response = await h.invoke(controller[handler], { user: { _id: 'attorney-a', role: 'attorney' } });
    assert.equal('cloudinaryUrl' in response.payload.contract, false);
    assert.equal('cloudinaryPublicId' in response.payload.contract, false);
  }
});
