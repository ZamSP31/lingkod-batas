const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const NotificationSchema = require("../src/models/Notification");
const clientId = "000000000000000000000001";
const contractId = "000000000000000000000002";
const otherClient = "000000000000000000000003";
function load(file, deps) {
  const context = { module: { exports: {} }, console: { error() {}, warn() {} }, require(name) {
    if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`);
    return deps[name];
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"), context);
  return context.module.exports;
}
const id = value => String(value?._id ?? value);
function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === "object" && "$ne" in value) return value.$ne === null ? row[key] != null : row[key] !== value.$ne;
    return value === null ? row[key] == null : id(row[key]) === id(value);
  });
}
function harness(preferences = {}) {
  const state = { rows: [], emails: [], failCreate: false, contracts: [
    { _id: contractId, clientId, assignedAttorneyId: "synthetic-attorney", status: "under_review", title: "Synthetic contract" },
    { _id: "000000000000000000000004", clientId: otherClient, assignedAttorneyId: "other-attorney", status: "under_review", title: "Other contract" },
  ] };
  const query = rows => ({ sort() { return this; }, select() { return this; }, limit() { return this; }, populate() { return this; },
    then(yes, no) { return Promise.resolve(rows).then(yes, no); } });
  const model = {
    findOne: async filter => state.rows.find(row => matches(row, filter)) || null,
    create: async values => {
      if (state.failCreate) throw new Error("Synthetic persistence failure");
      if (state.rows.some(row => id(row._id) === id(values._id))) { const error = new Error("duplicate"); error.code = 11000; throw error; }
      const row = new NotificationSchema(values); const error = row.validateSync(); if (error) throw error;
      row.createdAt = new Date(); row.save = async () => row; state.rows.push(row); return row;
    },
    find: filter => query(state.rows.filter(row => matches(row, filter))),
    countDocuments: async filter => state.rows.filter(row => matches(row, filter)).length,
    findOneAndDelete: async filter => { const index = state.rows.findIndex(row => matches(row, filter)); return index < 0 ? null : state.rows.splice(index, 1)[0]; },
  };
  const service = load("services/notificationService.js", {
    "node:crypto": require("node:crypto"), "../models/Notification": model,
    "../models/User": { findById: () => ({ select: async () => ({ email: "synthetic@example.invalid", fullName: "Synthetic Client", notificationSettings: preferences }) }) },
    "./emailService": { sendStatusNotificationEmail: async mail => { state.emails.push(mail); } },
  });
  const controller = load("controllers/notificationController.js", {
    "express-async-handler": fn => fn, "../models/Notification": model,
    "../models/Contract": { find: filter => query(state.contracts.filter(row => matches(row, filter))) },
    "../services/notificationService": service,
  });
  const event = { recipient: clientId, contract: contractId, type: "attorney-reviewing", title: "Attorney Review Commenced", message: "Synthetic review started", link: `/client/track-status/${contractId}` };
  async function invoke(name, notificationId, user = { _id: clientId, role: "client" }) {
    const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; } };
    await controller[name]({ user, query: {}, params: { id: notificationId } }, res); return res;
  }
  return { state, service, event, invoke };
}
test("concurrent review-start retries create one real-schema event and one mocked email", async () => {
  const h = harness(); await Promise.all(Array.from({ length: 12 }, () => h.service.createNotification(h.event)));
  assert.equal(h.state.rows.length, 1); assert.equal(h.state.emails.length, 1);
  assert.equal(id(h.state.rows[0].recipient), clientId);
});
test("failed persistence is recovered by the client's refresh without notifying another client", async () => {
  const h = harness(); h.state.failCreate = true;
  assert.equal(await h.service.createNotification(h.event), null);
  assert.equal(h.state.emails.length, 0); h.state.failCreate = false;
  const first = await h.invoke("getNotifications");
  assert.equal(first.body.notifications.length, 1); assert.equal(first.body.unreadCount, 1);
  assert.equal(first.body.notifications[0].link, `/client/track-status/${contractId}`);
  await h.invoke("getNotifications"); assert.equal(h.state.rows.length, 1); assert.equal(h.state.emails.length, 1);
});
test("in-app and email opt-outs are respected and deduplicated independently", async () => {
  for (const preferences of [{ inAppNotifications: false }, { emailNotifications: false }, { inAppNotifications: false, emailNotifications: false }]) {
    const h = harness(preferences); await h.invoke("getNotifications"); const result = await h.invoke("getNotifications");
    assert.equal(result.body.notifications.length, preferences.inAppNotifications === false ? 0 : 1);
    assert.equal(result.body.unreadCount, preferences.inAppNotifications === false ? 0 : 1);
    assert.equal(h.state.emails.length, preferences.emailNotifications === false ? 0 : 1);
  }
});
test("dismissing or reading a review-start event does not resurrect it or send another email", async () => {
  const h = harness(); await h.invoke("getNotifications"); const row = h.state.rows[0];
  await h.invoke("markAsRead", id(row._id)); assert.equal((await h.invoke("getNotifications")).body.unreadCount, 0);
  await h.invoke("deleteNotification", id(row._id));
  const result = await h.invoke("getNotifications"); assert.equal(result.body.notifications.length, 0);
  assert.equal(h.state.rows.length, 1); assert.equal(h.state.emails.length, 1);
});
test("notification dismissal remains restricted to the recipient", async () => {
  const h = harness(); await h.invoke("getNotifications");
  await assert.rejects(h.invoke("deleteNotification", id(h.state.rows[0]._id), { _id: otherClient, role: "client" }), /not found/);
  assert.equal(h.state.rows[0].dismissedAt, null);
});

test("N03 assignment remains intact after delivery failure and the client refresh recovers once", async () => {
  const { createHarness, fixture } = require("./helpers/isolatedHarness");
  const h = harness(); h.state.failCreate = true;
  const review = createHarness({ contracts: [fixture({ _id: contractId, clientId, status: "awaiting_attorney_review", assignedAttorneyId: null })] });
  const controller = review.load("controllers/attorneyController.js", { "../services/notificationService": h.service });
  const req = { user: { _id: "attorney-a", role: "attorney" }, params: { id: contractId } };
  assert.equal((await review.invoke(controller.assignContract, req)).statusCode, 200);
  assert.equal(review.contracts[0].status, "under_review"); assert.equal(h.state.rows.length, 0);
  h.state.contracts = review.contracts; h.state.failCreate = false;
  assert.equal((await h.invoke("getNotifications")).body.notifications.length, 1);
  await review.invoke(controller.assignContract, req); await h.invoke("getNotifications");
  assert.equal(h.state.rows.length, 1); assert.equal(h.state.emails.length, 1);
});
