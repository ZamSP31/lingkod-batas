const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/isolatedHarness');

test('Unmocked dependency fails before loading any SDK', () => {
  const h = createHarness();
  for (const name of ['mongoose', 'cloudinary', 'nodemailer', 'node:http', 'node:net', 'node:child_process', 'dotenv']) {
    assert.throws(() => h.dependency(name), /ISOLATION VIOLATION: unmocked dependency/);
  }
});

test('Cloudinary, OCR, AI and email mocks explicitly reject access', () => {
  const h = createHarness();
  for (const attempt of [
    () => h.dependency('../services/cloudinaryService').uploadToCloudinary(),
    () => h.dependency('../services/cloudinaryService').deleteFromCloudinary(),
    () => h.dependency('../services/ocrService').processContract(),
    () => h.dependency('../services/ragService').analyzeContract(),
    () => h.dependency('../services/emailService').sendMail(),
  ]) assert.throws(attempt, /ISOLATION VIOLATION/);
});

test('Unapproved source evaluation is rejected', () => {
  assert.throws(() => createHarness().load('config/db.js'), /reviewed source/);
});

test('Swallowed service attempt still fails the test invocation', async () => {
  const h = createHarness();
  await assert.rejects(h.invoke(async () => { try { h.deny('synthetic forbidden access'); } catch {} }), /Unexpected service access/);
});
