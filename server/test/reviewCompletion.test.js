const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, fixture, knownDefect } = require('./helpers/isolatedHarness');
const attorney = { _id: 'attorney-a', role: 'attorney', fullName: 'Synthetic Attorney' };

test('Completion denies an attorney assigned to another contract', async () => {
  const h = createHarness({ contracts: [fixture({ assignedAttorneyId: 'attorney-b' })] });
  const result = await h.invoke(h.load('controllers/attorneyController.js').completeReview, { user: attorney });
  assert.equal(result.statusCode, 403); assert.ok(result.error);
  assert.equal(h.calls.some((call) => call.name === 'Contract.save'), false);
});

test('Completion rejects an invalid contract risk override', async () => {
  const h = createHarness();
  const result = await h.invoke(h.load('controllers/attorneyController.js').completeReview, { user: attorney, body: { attorneyRiskOverride: 'invalid' } });
  assert.equal(result.statusCode, 400); assert.ok(result.error);
});

knownDefect(test, 'pending low-risk clause must block ordinary completion', async () => {
  const h = createHarness({ flags: [{ _id: 'flag-a', contractId: 'contract-a', aiRiskLevel: 'low', attorneyStatus: 'pending' }] });
  const result = await h.invoke(h.load('controllers/attorneyController.js').completeReview, { user: attorney });
  assert.ok(result.error, 'Completion must reject pending clause decisions');
  assert.equal(h.contracts[0].reportReleasedToClient, false);
});

knownDefect(test, 'processing contract must not be released', async () => {
  const h = createHarness({ contracts: [fixture({ status: 'ocr_processing' })] });
  const result = await h.invoke(h.load('controllers/attorneyController.js').completeReview, { user: attorney });
  assert.ok(result.error, 'Completion must reject unfinished processing');
});
