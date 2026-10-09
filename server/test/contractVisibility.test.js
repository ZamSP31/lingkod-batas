const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, fixture, knownDefect } = require('./helpers/isolatedHarness');

test('Client list is restricted to owned contracts', async () => {
  const h = createHarness({ contracts: [fixture(), fixture({ _id: 'contract-b', clientId: { _id: 'client-b' } })] });
  const result = await h.invoke(h.load('controllers/contractController.js').getContracts);
  assert.equal(result.payload.contracts.length, 1);
  assert.equal(result.payload.contracts[0]._id, 'contract-a');
});

for (const handler of ['getContractById', 'getContractReport', 'getContractStatus']) {
  test(`${handler} denies another client's contract`, async () => {
    const h = createHarness();
    const result = await h.invoke(h.load('controllers/contractController.js')[handler], { user: { _id: 'client-b', role: 'client' } });
    assert.equal(result.statusCode, 403); assert.ok(result.error); assert.equal(result.payload, undefined);
  });
}

for (const [label, overrides] of [
  ['unfinished', { status: 'under_review', reportReleasedToClient: false }],
  ['completed but unreleased', { status: 'completed', reportReleasedToClient: false }],
  ['release flag without completion', { status: 'under_review', reportReleasedToClient: true }],
]) {
  test(`Report denies owner when ${label}`, async () => {
    const h = createHarness({ contracts: [fixture(overrides)] });
    const result = await h.invoke(h.load('controllers/contractController.js').getContractReport);
    assert.equal(result.statusCode, 403); assert.ok(result.error);
    assert.equal(h.calls.some((call) => call.name === 'ContractFlag.find'), false);
  });
}

test('Owner can retrieve completed released report; view audit is mocked', async () => {
  const h = createHarness({ contracts: [fixture({ status: 'completed', reportReleasedToClient: true })], flags: [{ _id: 'flag-a', contractId: 'contract-a', attorneyStatus: 'approved' }] });
  const result = await h.invoke(h.load('controllers/contractController.js').getContractReport);
  assert.equal(result.statusCode, 200); assert.equal(result.payload.flags.length, 1);
  assert.equal(h.calls.filter((call) => call.name === 'audit').length, 1);
});

test('Status endpoint does not expose risk, notes, extracted text or storage URL', async () => {
  const h = createHarness();
  const result = await h.invoke(h.load('controllers/contractController.js').getContractStatus);
  for (const key of ['aiRiskLevel', 'attorneyNotes', 'rawOcrText', 'cloudinaryUrl']) assert.equal(key in result.payload, false);
});

for (const handler of ['getContracts', 'getContractById']) {
  for (const field of ['aiRiskLevel', 'attorneyNotes']) {
  knownDefect(test, `${handler} must hide unreleased ${field}`, async () => {
    const h = createHarness();
    const result = await h.invoke(h.load('controllers/contractController.js')[handler]);
    const record = result.payload.contract ?? result.payload.contracts[0];
    assert.equal(field in record, false);
  });
  }
}
