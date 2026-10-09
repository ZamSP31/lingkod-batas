const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, fixture, knownDefect } = require('./helpers/isolatedHarness');

knownDefect(test, 'released clause notes must reject modification', async () => {
  const h = createHarness({ contracts: [fixture({ status: 'completed', reportReleasedToClient: true })],
    flags: [{ _id: 'flag-a', contractId: 'contract-a', attorneyStatus: 'approved', attorneyNote: 'Original synthetic note' }] });
  const result = await h.invoke(h.load('controllers/attorneyController.js').updateFlag, {
    user: { _id: 'attorney-a', role: 'attorney' }, params: { flagId: 'flag-a' }, body: { attorneyNote: 'Changed synthetic note' },
  });
  assert.ok(result.error, 'Released flag modification must fail');
  assert.equal(h.flags[0].attorneyNote, 'Original synthetic note');
});
