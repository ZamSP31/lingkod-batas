const test = require("node:test");
const assert = require("node:assert/strict");
const { DAY_MS, oneYearFrom, renewalFields } = require("../src/utils/accountLifetime");
const { createAccountLifecycle } = require("../src/services/accountLifecycle");
const { checkSessionActivity, IDLE_MS } = require("../src/services/sessionActivity");
const clone = structuredClone;
function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === "$or") return value.some(part => matches(row, part));
    const actual = row[key];
    if (value instanceof Date) return actual instanceof Date && +actual === +value;
    if (value && typeof value === "object") return Object.entries(value).every(([op, expected]) => {
      if (op === "$lte") return actual != null && actual <= expected;
      if (op === "$gt") return actual != null && actual > expected;
      if (op === "$ne") return expected === null ? actual != null : actual !== expected;
      throw Error(`Unknown operator ${op}`);
    });
    return value === null ? actual == null : actual === value;
  });
}
function model(rows) {
  function update(row, changes) {
    Object.assign(row, clone(changes.$set || {}));
    for (const [key, value] of Object.entries(changes.$inc || {})) row[key] = (row[key] || 0) + value;
    for (const [key, value] of Object.entries(changes.$max || {})) if (row[key] < value) row[key] = value;
  }
  return {
    find: filter => ({ limit: async count => rows.filter(row => matches(row, filter)).slice(0, count).map(row => clone(row)) }),
    findOneAndUpdate: async (filter, changes) => {
      const row = rows.find(row => matches(row, filter));
      if (!row) return null;
      update(row, changes); return clone(row);
    },
    updateOne: async (filter, changes, options) => {
      let row = rows.find(row => matches(row, filter));
      if (!row && options?.upsert) { row = { ...filter, ...clone(changes.$setOnInsert) }; rows.push(row); }
      if (!row) return { modifiedCount: 0 };
      update(row, changes); return { modifiedCount: 1 };
    },
    exists: async filter => rows.some(row => matches(row, filter)),
  };
}
function setup({ rows, delivered = true, failCleanup = false, onMail } = {}) {
  let now = new Date("2027-01-01T00:00:00Z");
  rows ||= [{ _id: "client", role: "client", isActive: true, createdAt: new Date("2026-01-31T00:00:00Z"),
    accountExpiresAt: new Date("2027-01-31T00:00:00Z") }];
  const User = model(rows); const mail = []; const erased = []; const logs = [];
  const dependencies = { User, clock: () => now,
    sendWarning: async (user, deadline) => { mail.push({ user, deadline }); await onMail?.(user); return { delivered }; },
    eraseAccount: async id => { if (failCleanup) throw Error("storage unavailable"); erased.push(id); rows.splice(rows.findIndex(row => row._id === id), 1); },
    logAction: async event => logs.push(event),
  };
  const worker = createAccountLifecycle(dependencies);
  return { rows, User, worker, secondWorker: createAccountLifecycle(dependencies), mail, erased, logs, advance: days => { now = new Date(+now + days * DAY_MS); } };
}

test("calendar-year expiry clamps leap day; renewal only applies inside client warning period", () => {
  assert.equal(oneYearFrom("2024-02-29T12:00:00Z").toISOString(), "2025-02-28T12:00:00.000Z");
  const now = new Date("2027-01-01T00:00:00Z");
  const user = { role: "client", accountExpiresAt: new Date(+now + 30 * DAY_MS) };
  assert.equal(+renewalFields(user, now).accountExpiresAt, +oneYearFrom(now));
  assert.deepEqual(renewalFields({ ...user, role: "attorney" }, now), {});
  assert.deepEqual(renewalFields({ ...user, role: "admin" }, now), {});
  assert.deepEqual(renewalFields({ ...user, accountExpiresAt: new Date(+now + 31 * DAY_MS) }, now), {});
});
test("warning is sent once; deletion requires a full 30-day period and both deadlines", async () => {
  const h = setup(); await h.worker.tick(); await h.worker.tick();
  assert.equal(h.mail.length, 1); assert.equal(h.erased.length, 0);
  h.advance(29); await h.worker.tick(); assert.equal(h.erased.length, 0);
  h.advance(1); await h.worker.tick(); assert.deepEqual(h.erased, ["client"]);
  assert.deepEqual(h.logs.map(event => event.action), ["ACCOUNT_EXPIRY_WARNING", "ACCOUNT_EXPIRED_DELETED"]);
});
test("legacy overdue client receives a new 30-day notice; attorneys and administrators remain exempt", async () => {
  const rows = ["client", "attorney", "admin"].map(role => ({ _id: role, role, isActive: true, createdAt: new Date("2020-01-01") }));
  const h = setup({ rows }); await h.worker.tick();
  assert.equal(h.mail.length, 1); assert.equal(h.mail[0].user.role, "client");
  assert.equal(h.mail[0].deadline.toISOString(), "2027-01-31T00:00:00.000Z");
  assert.equal(h.erased.length, 0); h.advance(30); await h.worker.tick();
  assert.deepEqual(h.rows.map(row => row.role), ["attorney", "admin"]);
});
test("failed or simulated warning email never authorizes deletion", async () => {
  const h = setup({ delivered: false }); await h.worker.tick(); h.advance(40); await h.worker.tick();
  assert.equal(h.erased.length, 0); assert.equal(h.rows[0].accountWarningSentAt, undefined);
});
test("renewal during email delivery prevents stale warning from authorizing deletion", async () => {
  let h;
  h = setup({ onMail: async () => Object.assign(h.rows[0], renewalFields(h.rows[0], new Date("2027-01-01"))) });
  await h.worker.tick(); assert.equal(h.rows[0].accountWarningSentAt, null);
  h.advance(40); await h.worker.tick(); assert.equal(h.erased.length, 0);
});
test("renewed account clears a previous warning and cannot be deleted at its old deadline", async () => {
  const h = setup(); await h.worker.tick();
  Object.assign(h.rows[0], renewalFields(h.rows[0], new Date("2027-01-02")));
  h.advance(31); await h.worker.tick(); assert.equal(h.erased.length, 0);
  assert.equal(h.rows[0].accountExpiresAt.toISOString(), "2028-01-02T00:00:00.000Z");
});
test("cleanup failure retains a disabled retryable account instead of reporting deletion", async () => {
  const h = setup({ failCleanup: true }); await h.worker.tick(); h.advance(30); await h.worker.tick();
  assert.equal(h.rows[0].isActive, false); assert.ok(h.rows[0].accountDeletionStartedAt);
  assert.equal(h.logs.filter(event => event.action === "ACCOUNT_EXPIRED_DELETED").length, 0);
});
test("parallel workers share warning and deletion claims", async () => {
  const h = setup();
  await Promise.all([h.worker.tick(), h.secondWorker.tick()]); assert.equal(h.mail.length, 1);
  h.advance(30); await Promise.all([h.worker.tick(), h.secondWorker.tick()]); assert.equal(h.erased.length, 1);
});
test("session idle deadline is enforced even when background polling continues", async () => {
  const rows = []; const Session = model(rows); const issued = Date.parse("2027-01-01") / 1000;
  const params = { token: "synthetic-token", decoded: { id: "client", iat: issued, exp: issued + 86400 }, Session };
  assert.equal(await checkSessionActivity({ ...params, now: new Date(issued * 1000) }), true);
  assert.equal(await checkSessionActivity({ ...params, now: new Date(issued * 1000 + IDLE_MS - 1) }), true);
  assert.equal(await checkSessionActivity({ ...params, now: new Date(issued * 1000 + IDLE_MS) }), false);
  assert.notEqual(rows[0]._id, params.token);
});
test("explicit activity extends only its session and cannot revive an idle or absolutely expired token", async () => {
  const rows = []; const Session = model(rows); const issued = Date.parse("2027-01-01") / 1000;
  const params = { token: "one", decoded: { id: "client", iat: issued, exp: issued + 7200 }, Session };
  const at = offset => new Date(issued * 1000 + offset);
  assert.equal(await checkSessionActivity({ ...params, activity: true, now: at(30 * 60000) }), true);
  assert.equal(await checkSessionActivity({ ...params, now: at(70 * 60000) }), true);
  assert.equal(await checkSessionActivity({ ...params, token: "two", now: at(70 * 60000) }), false);
  assert.equal(await checkSessionActivity({ ...params, activity: true, now: at(90 * 60000) }), false);
  assert.equal(await checkSessionActivity({ ...params, now: at(120 * 60000) }), false);
});


test("real auth middleware enforces idle expiry and refreshes activity only on the dedicated endpoint", async () => {
  const fs = require("node:fs"); const vm = require("node:vm"); const jwt = require("jsonwebtoken");
  const issued = Math.floor(Date.now() / 1000) - 1800;
  const secret = "synthetic-session-secret";
  const token = jwt.sign({ id: "client", role: "client", sessionVersion: 0, purpose: "access", iat: issued, exp: issued + 7200 }, secret);
  const rows = []; const Session = model(rows);
  const deps = { jsonwebtoken: jwt, "express-async-handler": fn => fn,
    "../models/User": { findById: () => ({ select: async () => ({ _id: "client", isActive: true, sessionVersion: 0 }) }) },
    "../services/sessionActivity": require("../src/services/sessionActivity"), "../models/AccessSession": Session };
  const context = { module: { exports: {} }, process: { env: { JWT_SECRET: secret } }, require(name) {
    if (!(name in deps)) throw Error(`ISOLATION VIOLATION: ${name}`); return deps[name];
  } };
  vm.runInNewContext(fs.readFileSync(require.resolve("../src/middleware/auth"), "utf8"), context);
  async function invoke(method, originalUrl) {
    let next = false; let status;
    await context.module.exports.protect({ method, originalUrl, headers: { authorization: `Bearer ${token}` } },
      { status: value => { status = value; } }, () => { next = true; });
    return { next, status };
  }
  assert.equal((await invoke("GET", "/api/auth/profile")).next, true);
  assert.equal(+rows[0].lastActivityAt, issued * 1000);
  await invoke("POST", "/api/auth/activity"); assert.ok(+rows[0].lastActivityAt > issued * 1000);
  rows[0].lastActivityAt = new Date(Date.now() - IDLE_MS - 1000);
  await assert.rejects(invoke("GET", "/api/notifications"), /inactivity/);
  await assert.rejects(invoke("POST", "/api/auth/activity"), /inactivity/);
});


test("session initialization tolerates only a structured duplicate-id race and propagates database failures", async () => {
  const now = new Date(); const decoded = { id: "client", iat: Math.floor(+now / 1000), exp: Math.floor(+now / 1000) + 3600 };
  const Session = { updateOne: async () => { throw Object.assign(Error("race"), { code: 11000, keyPattern: { _id: 1 } }); }, exists: async () => true };
  assert.equal(await checkSessionActivity({ token: "synthetic", decoded, Session, now }), true);
  Session.updateOne = async () => { throw Error("database unavailable"); };
  await assert.rejects(checkSessionActivity({ token: "synthetic", decoded, Session, now }), /database unavailable/);
});
