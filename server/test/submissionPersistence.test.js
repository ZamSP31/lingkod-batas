const test = require("node:test");
const assert = require("node:assert/strict");
const { createSubmissionPersistence } = require("../src/services/submissionPersistence");

function harness() {
  let active = true;
  const events = [];
  const User = { db: { transaction: async operation => {
    events.push("begin");
    try { const result = await operation("synthetic-session"); events.push("commit"); return result; }
    catch (error) { events.push("abort"); throw error; }
  } }, findOneAndUpdate: async (filter, update, options) => {
    assert.equal(filter.isActive, true); assert.equal(filter.accountDeletionStartedAt, null);
    assert.equal(filter._id, "synthetic-user");
    assert.equal(update.$inc.__v, 1); assert.equal(options.session, "synthetic-session");
    events.push("owner-lock"); return active ? { _id: filter._id } : null;
  } };
  return { events, disable() { active = false; }, persist: createSubmissionPersistence(User) };
}

test("submission serializes the account lock and insert in the same transaction", async () => {
  const h = harness();
  await h.persist({ save: async ({ session }) => { assert.equal(session, "synthetic-session"); h.events.push("insert"); } }, "synthetic-user");
  assert.deepEqual(h.events, ["begin", "owner-lock", "insert", "commit"]);
});

test("deletion winning before persistence prevents an already-uploaded contract from being inserted", async () => {
  const h = harness(); h.disable();
  await assert.rejects(h.persist({ save: async () => { throw new Error("Must not insert"); } }, "synthetic-user"), { statusCode: 401 });
  assert.deepEqual(h.events, ["begin", "owner-lock", "abort"]);
});

test("failed inserts abort and retry request-number conflicts outside the transaction", async () => {
  const h = harness(); let attempts = 0;
  const doc = { isNew: true, requestNumber: "old", save: async () => {
    if (++attempts === 1) throw Object.assign(new Error("Synthetic duplicate"), { code: 11000, keyPattern: { requestNumber: 1 } });
    assert.equal(doc.requestNumber, undefined);
  } };
  await h.persist(doc, "synthetic-user");
  assert.deepEqual(h.events, ["begin", "owner-lock", "abort", "begin", "owner-lock", "commit"]);
});
