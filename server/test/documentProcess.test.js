const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createDocumentRunner } = require('../src/services/documentProcessingService');

function syntheticPdf(pageCount = 1) {
  const text = 'Synthetic employment agreement for isolated extraction verification. No real personal information is used in this document.';
  const stream = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${Array.from({ length: pageCount }, (_, i) => `${i + 5} 0 R`).join(' ')}] /Count ${pageCount} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    ...Array.from({ length: pageCount }, () => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents 4 0 R >>'),
  ];
  let body = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(body)); body += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const start = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(body);
}

test('real isolated parser extracts a synthetic digital PDF without OCR/network', { timeout: 20000 }, async () => {
  const run = createDocumentRunner({ timeoutMs: 10000 });
  const result = await run(syntheticPdf(), 'application/pdf');
  assert.equal(result.method, 'direct'); assert.equal(result.flaggedForReview, false);
  assert.ok(result.text.includes('Synthetic employment agreement'));
});

test('real isolated parser rejects a synthetic 51-page PDF', { timeout: 20000 }, async () => {
  await assert.rejects(createDocumentRunner({ timeoutMs: 10000 })(syntheticPdf(51), 'application/pdf'), /supported limits/);
});

test('real processor teardown terminates its spawned process tree', { timeout: 20000 }, async () => {
  const run = createDocumentRunner({ timeoutMs: 10000, workerPath: path.join(__dirname, 'fixtures/processorTree.cjs') });
  const result = await run(Buffer.from('%PDF synthetic'), 'application/pdf');
  const pid = Number(result.text); assert.ok(Number.isInteger(pid) && pid > 0);
  assert.throws(() => process.kill(pid, 0), /ESRCH|No such process|not found/i);
});

test('real timed-out extraction terminates its processor', { timeout: 20000 }, async () => {
  let pid;
  const run = createDocumentRunner({ timeoutMs: 500, workerPath: path.join(__dirname, 'fixtures/processorTree.cjs'),
    forkImpl(...args) { const child = require('node:child_process').fork(...args); pid = child.pid; return child; } });
  await assert.rejects(run(Buffer.from('%PDF hang'), 'application/pdf'), /two-minute/);
  assert.throws(() => process.kill(pid, 0), /ESRCH|No such process|not found/i);
});

test('actual worker disconnect handler terminates native descendants on parent restart', { timeout: 20000 }, async () => {
  const { fork } = require('node:child_process');
  const env = {};
  if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
  const child = fork(path.join(__dirname, 'fixtures/processorDisconnect.cjs'), [], {
    execArgv: [], detached: process.platform !== 'win32', windowsHide: true,
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'], env,
  });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const message = await new Promise((resolve, reject) => { child.once('message', resolve); child.once('error', reject); });
  child.disconnect(); await exited;
  assert.throws(() => process.kill(message.pid, 0), /ESRCH|No such process|not found/i);
});
