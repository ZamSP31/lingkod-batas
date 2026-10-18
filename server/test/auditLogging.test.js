const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const AuditLog = require("../src/models/AuditLog");
function load(file, deps) {
  const context = { module: { exports: {} }, Date, require(name) {
    if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`);
    return deps[name];
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"), context);
  return context.module.exports;
}
const response = () => ({ status() { return this; }, json() {}, send() {}, setHeader() {} });
function harness() {
  const filters = [];
  const query = { sort() { return this; }, skip() { return this; }, limit() { return this; }, lean: async () => [] };
  const controller = load("controllers/auditController.js", {
    "express-async-handler": fn => fn,
    "../models/AuditLog": { countDocuments: async f => { filters.push(f); return 0; }, find(f) { filters.push(f); return query; } },
    "../models/Contract": {}, "../services/contractAccess": {},
    "../utils/securityUtils": require("../src/utils/securityUtils"),
  });
  return { controller, filters };
}
test("profile audit action passes actual schema validation", () => {
  assert.equal(new AuditLog({ action: "USER_PROFILE_UPDATE", entityType: "user", userRole: "client" }).validateSync(), undefined);
});
test("list, count and export share Philippine day, search, category and visibility filters", async () => {
  const { controller, filters } = harness();
  const req = { user: { role: "attorney", _id: "synthetic-attorney" }, query: {
    fromDate: "2026-10-17", toDate: "2026-10-17", q: "Synthetic", category: "auth" } };
  await controller.getAuditLogs(req, response());
  await controller.exportAuditLogsCsv(req, response());
  assert.equal(filters.length, 3);
  for (const f of filters) {
    assert.equal(f.userId, "synthetic-attorney");
    assert.equal(f.timestamp.$gte.toISOString(), "2026-10-16T16:00:00.000Z");
    assert.equal(f.timestamp.$lt.toISOString(), "2026-10-17T16:00:00.000Z");
    assert.ok(f.action.$in.includes("USER_PROFILE_UPDATE"));
    assert.ok(f.$or.some(item => item.userName?.$regex === "Synthetic"));
    assert.deepEqual(f, filters[0]);
  }
});
test("invalid dates and reversed ranges are rejected before querying", async () => {
  for (const query of [{ fromDate: "2026-02-29" }, { toDate: "2026-13-01" }, { fromDate: ["2026-10-17"] },
    { fromDate: "" }, { toDate: "10/17/2026" }, { fromDate: "2026-10-18", toDate: "2026-10-17" }]) {
    const { controller, filters } = harness();
    const req = { user: { role: "admin" }, query };
    await assert.rejects(controller.getAuditLogs(req, response()), { statusCode: 400 });
    await assert.rejects(controller.exportAuditLogsCsv(req, response()), { statusCode: 400 });
    assert.equal(filters.length, 0);
  }
});
test("open ranges, leap days and unfiltered requests retain admin visibility", async () => {
  for (const query of [{ fromDate: "2024-02-29" }, { toDate: "2026-12-31" }, {}]) {
    const { controller, filters } = harness();
    await controller.getAuditLogs({ user: { role: "admin" }, query }, response());
    const f = filters[0];
    assert.equal(f.userId, undefined);
    if (query.fromDate) assert.equal(f.timestamp.$gte.toISOString(), "2024-02-28T16:00:00.000Z");
    if (query.toDate) assert.equal(f.timestamp.$lt.toISOString(), "2026-12-31T16:00:00.000Z");
    if (!Object.keys(query).length) assert.equal(f.timestamp, undefined);
  }
});
test("profile success logs field names without values; failure logs no success", async () => {
  for (const fail of [false, true]) {
    const events = [];
    const controller = load("controllers/authController.js", {
      "express-async-handler": fn => fn, "express-validator": {}, "../services/authSecurity": {},
      "../services/auditService": { logAction: async e => { events.push(e); } },
      "../services/authService": { updateProfile: async () => {
        if (fail) throw new Error("Invalid password");
        return { id: "synthetic", fullName: "Updated", email: "synthetic@example.invalid", role: "client" };
      } },
    });
    const req = { user: { _id: "synthetic", fullName: "Before" }, body: {
      fullName: "Updated", newPassword: "synthetic-secret", currentPassword: "old-secret",
      contactNumber: "09123456789", notificationSettings: { emailNotifications: false } } };
    if (fail) {
      await assert.rejects(controller.updateProfile(req, response()), /Invalid password/);
      assert.equal(events.length, 0);
    } else {
      await controller.updateProfile(req, response());
      assert.equal(events.length, 1);
      assert.equal(events[0].action, "USER_PROFILE_UPDATE");
      assert.deepEqual(JSON.parse(JSON.stringify(events[0].details)), { passwordChanged: true,
        changedFields: ["fullName", "contactNumber", "notificationSettings.emailNotifications", "password"] });
    }
  }
});
