const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, fixture } = require('./helpers/isolatedHarness');
const attorney = { _id: 'attorney-a', role: 'attorney', fullName: 'Synthetic Attorney' };
const other = { _id: 'attorney-b', role: 'attorney', fullName: 'Other Synthetic Attorney' };
const reviewed = (overrides = {}) => ({ _id: 'flag-a', contractId: 'contract-a', clauseIndex: 0,
  attorneyStatus: 'approved', aiRiskLevel: 'low', includedInReport: true, ...overrides });
const invoke = (h, handler, values = {}) => h.invoke(h.load('controllers/attorneyController.js')[handler], { user: attorney, ...values });

test('queue exposes own work and minimal ready/unassigned metadata only', async () => {
  const h = createHarness({ contracts: [fixture(), fixture({ _id: 'other', assignedAttorneyId: 'attorney-b' }),
    fixture({ _id: 'ready', assignedAttorneyId: null, status: 'awaiting_attorney_review' }),
    fixture({ _id: 'processing', assignedAttorneyId: null, status: 'ocr_processing' })] });
  const result = await invoke(h, 'getReviewQueue');
  assert.deepEqual(result.payload.contracts.map((c) => c._id), ['contract-a', 'ready']);
  const ready = result.payload.contracts[1];
  for (const field of ['clientId', 'rawOcrText', 'cloudinaryUrl', 'attorneyNotes', 'aiRiskLevel']) assert.equal(field in ready, false);
  const unassigned = await invoke(h, 'getReviewQueue', { query: { assigned: 'unassigned' } });
  assert.deepEqual(unassigned.payload.contracts.map((c) => c._id), ['ready']);
});

test('competing claims have one winner and cannot steal the assignment', async () => {
  const h = createHarness({ contracts: [fixture({ assignedAttorneyId: null, status: 'awaiting_attorney_review' })] });
  const outcomes = await Promise.all([invoke(h, 'assignContract'), invoke(h, 'assignContract', { user: other })]);
  assert.equal(outcomes.filter((r) => r.statusCode === 200).length, 1);
  assert.equal(outcomes.filter((r) => r.statusCode === 403).length, 1);
  assert.equal(h.contracts[0].status, 'under_review');
  assert.equal(h.calls.filter((c) => c.name === 'notification').length, 1);
});

for (const status of ['pending', 'ocr_processing', 'ai_analysis', 'completed', 'rejected']) {
  test(`unassigned ${status} contract cannot be claimed`, async () => {
    const h = createHarness({ contracts: [fixture({ assignedAttorneyId: null, status })] });
    const result = await invoke(h, 'assignContract');
    assert.equal(result.statusCode, 409); assert.equal(h.contracts[0].assignedAttorneyId, null);
    assert.equal(h.contracts[0].status, status);
  });
}

test('reopening own assignment is idempotent; another attorney cannot reassign it', async () => {
  const h = createHarness();
  assert.equal((await invoke(h, 'assignContract')).statusCode, 200);
  assert.equal((await invoke(h, 'assignContract', { user: other })).statusCode, 403);
  assert.equal(h.contracts[0].assignedAttorneyId, attorney._id);
  assert.equal(h.calls.some((c) => c.name === 'notification'), false);
});

for (const handler of ['getContractById', 'getContractReport', 'getContractStatus']) {
  test(`${handler} rejects attorneys outside the assignment`, async () => {
    const h = createHarness({ contracts: [fixture({ status: 'completed', reportReleasedToClient: true })] });
    const result = await h.invoke(h.load('controllers/contractController.js')[handler], { user: other });
    assert.equal(result.statusCode, 403); assert.equal(result.payload, undefined);
  });
}

test('attorney contract list contains assigned records only', async () => {
  const h = createHarness({ contracts: [fixture(), fixture({ _id: 'other', assignedAttorneyId: 'attorney-b' }), fixture({ _id: 'unassigned', assignedAttorneyId: null })] });
  const result = await h.invoke(h.load('controllers/contractController.js').getContracts, { user: attorney });
  assert.deepEqual(result.payload.contracts.map((c) => c._id), ['contract-a']);
});

test('flag reads and writes cannot implicitly claim an unassigned contract', async () => {
  const h = createHarness({ contracts: [fixture({ assignedAttorneyId: null, status: 'awaiting_attorney_review' })], flags: [reviewed()] });
  assert.equal((await invoke(h, 'getContractFlags')).statusCode, 403);
  assert.equal((await invoke(h, 'updateFlag', { params: { flagId: 'flag-a' }, body: { attorneyNote: 'Changed' } })).statusCode, 403);
  assert.equal(h.contracts[0].assignedAttorneyId, null); assert.equal(h.flags[0].attorneyNote, undefined);
});

test('released report payload excludes pending, dismissed, and explicitly excluded clauses', async () => {
  const h = createHarness({ contracts: [fixture({ status: 'completed', reportReleasedToClient: true })], flags: [reviewed(),
    reviewed({ _id: 'pending', attorneyStatus: 'pending' }), reviewed({ _id: 'dismissed', attorneyStatus: 'dismissed' }),
    reviewed({ _id: 'excluded', includedInReport: false })] });
  const result = await h.invoke(h.load('controllers/contractController.js').getContractReport);
  assert.deepEqual(result.payload.flags.map((flag) => flag._id), ['flag-a']);
  assert.equal(result.payload.contract.attorneyNotes, 'INTERNAL SYNTHETIC NOTE');
  for (const key of ['rawOcrText', 'cloudinaryUrl', 'cloudinaryPublicId', 'processingToken']) assert.equal(key in result.payload.contract, false);
});

test('unreleased client responses exclude virtual risk, overrides and storage data', async () => {
  const h = createHarness({ contracts: [fixture({ finalRiskLevel: 'high', attorneyRiskOverride: 'high', processingToken: 'synthetic-lease' })] });
  for (const handler of ['getContracts', 'getContractById']) {
    const result = await h.invoke(h.load('controllers/contractController.js')[handler]);
    const doc = result.payload.contract ?? result.payload.contracts[0];
    for (const key of ['finalRiskLevel', 'attorneyRiskOverride', 'processingToken', 'rawOcrText', 'cloudinaryUrl', 'cloudinaryPublicId']) assert.equal(key in doc, false);
  }
});

test('every clause, including excluded low-risk clauses, requires a decision', async () => {
  const h = createHarness({ flags: [reviewed(), reviewed({ _id: 'pending', attorneyStatus: 'pending', includedInReport: false })] });
  const result = await invoke(h, 'completeReview');
  assert.equal(result.statusCode, 409); assert.equal(h.contracts[0].status, 'under_review');
  assert.equal(h.contracts[0].__v, undefined); // parent write was rolled back
});

test('zero-clause/manual transcription cases cannot produce an empty report', async () => {
  const h = createHarness(); const result = await invoke(h, 'completeReview');
  assert.equal(result.statusCode, 409); assert.equal(h.contracts[0].reportReleasedToClient, false);
});

test('completion and simultaneous reset cannot leave a released pending decision', async () => {
  const h = createHarness({ flags: [reviewed()] });
  const results = await Promise.all([
    invoke(h, 'updateFlag', { params: { flagId: 'flag-a' }, body: { attorneyStatus: 'pending' } }),
    invoke(h, 'completeReview'),
  ]);
  assert.ok(results.some((result) => result.statusCode === 409));
  assert.equal(h.contracts[0].reportReleasedToClient && h.flags[0].attorneyStatus === 'pending', false);
});

test('two simultaneous completion requests release once and emit one notification', async () => {
  const h = createHarness({ flags: [reviewed()] });
  const results = await Promise.all([invoke(h, 'completeReview'), invoke(h, 'completeReview')]);
  assert.deepEqual(results.map((r) => r.statusCode).sort(), [200, 409]);
  assert.equal(h.calls.filter((c) => c.name === 'notification').length, 1);
});

test('completed drafts permit release only, while completed and released clauses are frozen', async () => {
  const h = createHarness({ flags: [reviewed()] });
  assert.equal((await invoke(h, 'completeReview', { body: { releaseReport: false, attorneyNotes: 'Final synthetic advice' } })).statusCode, 200);
  assert.equal((await invoke(h, 'updateFlag', { params: { flagId: 'flag-a' }, body: { attorneyNote: 'Changed' } })).statusCode, 409);
  assert.equal((await invoke(h, 'completeReview', { body: { releaseReport: true, attorneyNotes: 'Changed advice' } })).statusCode, 409);
  assert.equal((await invoke(h, 'completeReview', { body: { releaseReport: true } })).statusCode, 200);
  assert.equal(h.contracts[0].attorneyNotes, 'Final synthetic advice');
  assert.equal((await invoke(h, 'completeReview', { body: { releaseReport: false } })).statusCode, 409);
});

test('strict types reject malformed decisions and an override requires a risk level', async () => {
  const h = createHarness({ flags: [reviewed()] });
  for (const body of [{ attorneyNote: {} }, { includedInReport: 'false' }, { attorneyStatus: '' },
    { attorneyStatus: 'overridden' }, { attorneyStatus: 'dismissed', includedInReport: true }]) {
    assert.equal((await invoke(h, 'updateFlag', { params: { flagId: 'flag-a' }, body })).statusCode, 400);
  }
  assert.equal((await invoke(h, 'completeReview', { body: { releaseReport: 'false' } })).statusCode, 400);
  assert.equal(h.flags[0].attorneyStatus, 'approved');
});

test('approval clears a stale override and dismissal excludes the clause', async () => {
  const h = createHarness({ flags: [reviewed({ attorneyStatus: 'overridden', attorneyRiskOverride: 'high' })] });
  assert.equal((await invoke(h, 'updateFlag', { params: { flagId: 'flag-a' }, body: { attorneyStatus: 'approved' } })).statusCode, 200);
  assert.equal(h.flags[0].attorneyRiskOverride, null);
  assert.equal((await invoke(h, 'updateFlag', { params: { flagId: 'flag-a' }, body: { attorneyStatus: 'dismissed' } })).statusCode, 200);
  assert.equal(h.flags[0].includedInReport, false);
});

test('failed clause persistence rolls back the parent review write', async () => {
  const h = createHarness({ flags: [reviewed()] });
  h.dependency('../models/ContractFlag').findOneAndUpdate = () => { throw new Error('Synthetic persistence failure'); };
  const result = await invoke(h, 'updateFlag', { params: { flagId: 'flag-a' }, body: { attorneyNote: 'Changed' } });
  assert.ok(result.error); assert.equal(h.contracts[0].__v, undefined);
  assert.equal(h.flags[0].attorneyNote, undefined);
});

test('audit listing/export are scoped to the actor and contract trails require assignment', async () => {
  const h = createHarness({ logs: [
    { _id: 'mine', userId: 'attorney-a', action: 'REPORT_VIEWED', entityId: 'contract-a', timestamp: new Date().toISOString(), userName: 'Own synthetic actor' },
    { _id: 'other', userId: 'attorney-b', action: 'REPORT_VIEWED', entityId: 'other-contract', timestamp: new Date().toISOString(), userName: 'Other synthetic actor' },
  ] });
  const controller = h.load('controllers/auditController.js');
  const listed = await h.invoke(controller.getAuditLogs, { user: attorney });
  assert.deepEqual(listed.payload.logs.map((log) => log._id), ['mine']);
  const exported = await h.invoke(controller.exportAuditLogsCsv, { user: attorney });
  assert.ok(exported.payload.includes('Own synthetic actor')); assert.ok(!exported.payload.includes('Other synthetic actor'));
  const denied = await h.invoke(controller.getContractAuditTrail, { user: other, params: { contractId: 'contract-a' } });
  assert.equal(denied.statusCode, 403); assert.equal(denied.payload, undefined);
  const allowed = await h.invoke(controller.getContractAuditTrail, { user: attorney, params: { contractId: 'contract-a' } });
  assert.equal(allowed.statusCode, 200); assert.equal(allowed.payload.trail.length, 1);
});
