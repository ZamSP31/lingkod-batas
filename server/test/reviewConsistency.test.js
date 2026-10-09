const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./helpers/isolatedHarness');

test('Flag update denies attorney assigned to another contract', async () => {
  const h = createHarness({ flags: [{ _id: 'flag-a', contractId: 'contract-a', attorneyStatus: 'pending' }] });
  const result = await h.invoke(h.load('controllers/attorneyController.js').updateFlag, {
    user: { _id: 'attorney-b', role: 'attorney' }, params: { flagId: 'flag-a' }, body: { attorneyStatus: 'approved' },
  });
  assert.equal(result.statusCode, 403); assert.ok(result.error);
  assert.equal(h.flags[0].attorneyStatus, 'pending');
});

test('Flag update rejects unknown decision status', async () => {
  const h = createHarness({ flags: [{ _id: 'flag-a', contractId: 'contract-a', attorneyStatus: 'pending' }] });
  const result = await h.invoke(h.load('controllers/attorneyController.js').updateFlag, {
    user: { _id: 'attorney-a', role: 'attorney' }, params: { flagId: 'flag-a' }, body: { attorneyStatus: 'invented' },
  });
  assert.equal(result.statusCode, 400); assert.ok(result.error);
});
