const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const security = require("../src/services/authSecurity");
const TEST_SECRET = "synthetic-test-secret-never-used-outside-tests";
const PASSWORD = "SyntheticPassword!123";

// Only in-memory records and explicitly mapped local dependencies are available.
function matches(doc, query) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === "$or") return expected.some((q) => matches(doc, q));
    if (key === "$and") return expected.every((q) => matches(doc, q));
    if (expected && typeof expected === "object") {
      return Object.entries(expected).every(([op, value]) => {
        if (op === "$gt") return doc[key] != null && doc[key] > value;
        if (op === "$lt") return doc[key] != null && doc[key] < value;
        if (op === "$lte") return doc[key] != null && doc[key] <= value;
        if (op === "$exists") return (doc[key] !== undefined) === value;
        throw new Error(`Unsupported test query ${op}`);
      });
    }
    return doc[key] === expected;
  });
}

function harness(overrides = {}) {
  const row = { _id: "synthetic-user", email: "owner@example.invalid", fullName: "Synthetic Owner",
    role: "client", isActive: true, sessionVersion: 0, password: bcrypt.hashSync(PASSWORD, 4), ...overrides };
  const emails = [];
  const writes = [];
  function doc() { return row && { ...row, comparePassword: (value) => bcrypt.compare(value, row.password) }; }
  const query = (read) => ({ select() { return this; }, then(yes, no) { return Promise.resolve().then(read).then(yes, no); } });
  const User = {
    findOne: (filter) => query(() => matches(row, filter) ? doc() : null),
    findById: (id) => query(() => id === row._id ? doc() : null),
    findOneAndUpdate: (filter, changes) => query(() => {
      if (!matches(row, filter)) return null;
      writes.push({ filter, changes });
      for (const [key, value] of Object.entries(changes.$set || {})) {
        const parts = key.split(".");
        let target = row;
        for (const part of parts.slice(0, -1)) target = target[part] ||= {};
        target[parts.at(-1)] = value;
      }
      for (const [key, value] of Object.entries(changes.$inc || {})) row[key] = (row[key] || 0) + value;
      for (const key of Object.keys(changes.$unset || {})) delete row[key];
      return doc();
    }),
  };
  function load(relative, additional = {}) {
    const deps = { crypto, jsonwebtoken: jwt, bcryptjs: bcrypt, "express-async-handler": (fn) => fn, "express-rate-limit": require("express-rate-limit"),
      "./authSecurity": security,
      "../utils/accountLifetime": require("../src/utils/accountLifetime"),
      "../services/sessionActivity": { checkSessionActivity: async () => true },
      "../models/AccessSession": {}, "../models/User": User,
      "../models/PendingRegistration": {}, "../models/Contract": {}, "../models/ContractFlag": {}, "../models/Notification": {},
      "./cloudinaryService": {}, "./emailService": { sendOtpEmail: async (mail) => { emails.push(mail); } }, ...additional };
    const context = { module: { exports: {} }, process: { env: { JWT_SECRET: TEST_SECRET, NODE_ENV: "production" } },
      console: { log() { throw new Error("Unexpected log"); } },
      require(name) { if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`); return deps[name]; } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", relative), "utf8"), context);
    return context.module.exports;
  }
  return { row, emails, writes, load, auth: load("services/authService.js"),
    async login() { return this.auth.login({ email: row.email, password: PASSWORD }); },
    async protect(token) {
      const middleware = load("middleware/auth.js").protect;
      let status = 200; let next = false; let error;
      try { await middleware({ headers: { authorization: `Bearer ${token}` } }, { status(value) { status = value; } }, () => { next = true; }); } catch (caught) { error = caught; }
      return { status, next, error };
    } };
}

test("OTP resend and verification require password-established challenge", async () => {
  const h = harness();
  await assert.rejects(h.auth.resendLogin2FA({ email: h.row.email }), /password again/);
  await assert.rejects(h.auth.verifyLogin2FA({ email: h.row.email, otp: "123456" }), /password again/);
  assert.equal(h.emails.length, 0); assert.equal(h.writes.length, 0);
  await assert.rejects(h.auth.login({ email: h.row.email, password: "wrong" }), /Invalid email or password/);
  assert.equal(h.row.loginChallengeHash, undefined);
});

test("valid password and OTP establish session; challenge is hashed, single use and not an access token", async () => {
  const h = harness(); const result = await h.login();
  assert.match(result.challengeId, /^[a-f0-9]{64}$/);
  assert.equal(h.row.loginChallengeHash, security.hash(result.challengeId));
  const payload = { email: h.row.email, otp: h.emails[0].otp, challengeId: result.challengeId };
  const outcomes = await Promise.allSettled([h.auth.verifyLogin2FA(payload), h.auth.verifyLogin2FA(payload)]);
  assert.equal(outcomes.filter((v) => v.status === "fulfilled").length, 1);
  const response = outcomes.find((v) => v.status === "fulfilled").value;
  assert.equal((await h.protect(response.token)).next, true);
  assert.equal((await h.protect(result.challengeId)).status, 401);
  assert.equal(response.user.password, undefined); assert.equal(response.user.sessionVersion, undefined);
  assert.equal(h.row.loginChallengeHash, undefined);
});

test("wrong challenge, wrong email, expiry and superseded challenges cannot verify", async () => {
  const h = harness(); const first = await h.login(); const firstOtp = h.emails[0].otp;
  const second = await h.login();
  await assert.rejects(h.auth.verifyLogin2FA({ email: h.row.email, otp: firstOtp, challengeId: first.challengeId }));
  await assert.rejects(h.auth.verifyLogin2FA({ email: "other@example.invalid", otp: h.emails[1].otp, challengeId: second.challengeId }));
  await assert.rejects(h.auth.verifyLogin2FA({ email: h.row.email, otp: h.emails[1].otp, challengeId: "a".repeat(64) }));
  h.row.loginChallengeExpires = new Date(0);
  await assert.rejects(h.auth.verifyLogin2FA({ email: h.row.email, otp: h.emails[1].otp, challengeId: second.challengeId }));
});

test("concurrent wrong OTPs cannot exceed the five-attempt budget", async () => {
  const h = harness(); const login = await h.login(); const correct = h.emails[0].otp;
  const wrong = correct === "111111" ? "222222" : "111111";
  await Promise.allSettled(Array.from({ length: 20 }, () => h.auth.verifyLogin2FA({ email: h.row.email, otp: wrong, challengeId: login.challengeId })));
  assert.equal(h.row.twoFactorOtpAttempts, 5);
  await assert.rejects(h.auth.verifyLogin2FA({ email: h.row.email, otp: correct, challengeId: login.challengeId }));
});

test("resend enforces cooldown, preserves expiry and attempts, and invalidates old OTP", async () => {
  const h = harness(); const login = await h.login(); const filter = { email: h.row.email, challengeId: login.challengeId };
  await assert.rejects(h.auth.resendLogin2FA(filter), /wait 60 seconds/);
  const expiry = h.row.loginChallengeExpires.getTime();
  h.row.loginOtpSentAt = new Date(Date.now() - 61000); h.row.twoFactorOtpAttempts = 2;
  await h.auth.resendLogin2FA(filter);
  assert.equal(h.row.twoFactorOtpAttempts, 2); assert.equal(h.row.loginChallengeExpires.getTime(), expiry);
  assert.equal(h.row.twoFactorOtp, security.hash(h.emails[1].otp));
  h.row.twoFactorOtpAttempts = 5; h.row.loginOtpSentAt = new Date(0);
  await assert.rejects(h.auth.resendLogin2FA(filter));
});

test("direct profile email changes are rejected and ordinary updates preserve sessions", async () => {
  const h = harness();
  await assert.rejects(h.auth.updateProfile(h.row._id, { email: "replacement@example.invalid" }, 0), /verified email change/);
  assert.equal(h.row.email, "owner@example.invalid");
  const user = await h.auth.updateProfile(h.row._id, { fullName: "Updated Name", notificationSettings: { emailNotifications: false } }, 0);
  assert.equal(user.fullName, "Updated Name"); assert.equal(h.row.sessionVersion, 0);
  await assert.rejects(h.auth.updateProfile(h.row._id, { newPassword: "StrongNewPassword123" }, 0), /current password/);
});

test("email changes require password and new mailbox confirmation; success revokes sessions", async () => {
  const h = harness(); const token = h.auth.generateToken(h.row._id, h.row.role, 0);
  await assert.rejects(h.auth.requestEmailChange(h.row._id, { email: "new@example.invalid" }, 0), /current password/);
  await h.auth.requestEmailChange(h.row._id, { email: "new@example.invalid", currentPassword: PASSWORD }, 0);
  assert.equal(h.row.email, "owner@example.invalid"); assert.equal(h.emails[0].toEmail, "new@example.invalid");
  await h.auth.confirmEmailChange(h.row._id, { otp: h.emails[0].otp }, 0);
  assert.equal(h.row.email, "new@example.invalid"); assert.equal(h.row.sessionVersion, 1);
  assert.equal((await h.protect(token)).status, 401);
  await assert.rejects(h.auth.confirmEmailChange(h.row._id, { otp: h.emails[0].otp }, 0));
});

test("email confirmation attempt budget, expiry and stale session prevent changes", async () => {
  const h = harness(); await h.auth.requestEmailChange(h.row._id, { email: "new@example.invalid", currentPassword: PASSWORD }, 0);
  const code = h.emails[0].otp; const wrong = code === "111111" ? "222222" : "111111";
  await Promise.allSettled(Array.from({ length: 15 }, () => h.auth.confirmEmailChange(h.row._id, { otp: wrong }, 0)));
  assert.equal(h.row.emailChangeAttempts, 5);
  await assert.rejects(h.auth.confirmEmailChange(h.row._id, { otp: code }, 0));
  h.row.emailChangeAttempts = 0; h.row.emailChangeExpires = new Date(0);
  await assert.rejects(h.auth.confirmEmailChange(h.row._id, { otp: code }, 0));
  h.row.sessionVersion = 1;
  await assert.rejects(h.auth.requestEmailChange(h.row._id, { email: "new@example.invalid", currentPassword: PASSWORD }, 0));
  assert.equal(h.row.email, "owner@example.invalid");
});

test("password change hashes password, revokes sessions and clears all pending recovery grants", async () => {
  const h = harness(); const oldToken = h.auth.generateToken(h.row._id, h.row.role, 0);
  await h.login();
  h.row.resetPasswordToken = "synthetic-old-reset"; h.row.pendingEmail = "replacement@example.invalid";
  await h.auth.updateProfile(h.row._id, { currentPassword: PASSWORD, newPassword: "NewStrongPassword123" }, 0);
  assert.equal(await bcrypt.compare("NewStrongPassword123", h.row.password), true);
  assert.equal(h.row.sessionVersion, 1); assert.equal(h.row.pendingEmail, undefined);
  assert.equal(h.row.resetPasswordToken, undefined); assert.equal(h.row.loginChallengeHash, undefined);
  assert.equal((await h.protect(oldToken)).status, 401);
  assert.equal((await h.protect(h.auth.generateToken(h.row._id, h.row.role, 1))).next, true);
});

test("password reset token is single use, increments legacy version and rejects inactive users", async () => {
  const h = harness(); delete h.row.sessionVersion;
  const token = security.secret(); h.row.resetPasswordToken = security.hash(token); h.row.resetPasswordExpires = new Date(Date.now() + 60000);
  const outcomes = await Promise.allSettled([1, 2].map(() => h.auth.resetPassword({ token, newPassword: "NewStrongPassword123" })));
  assert.equal(outcomes.filter((v) => v.status === "fulfilled").length, 1);
  assert.equal(h.row.sessionVersion, 1); assert.equal(h.row.resetPasswordToken, undefined);
  assert.equal(await bcrypt.compare("NewStrongPassword123", h.row.password), true);
  h.row.isActive = false; h.row.resetPasswordToken = security.hash(token); h.row.resetPasswordExpires = new Date(Date.now() + 60000);
  await assert.rejects(h.auth.resetPassword({ token, newPassword: "NewStrongPassword123" }));
});

test("legacy access tokens and non-access JWTs are rejected even with valid signature", async () => {
  const h = harness();
  assert.equal((await h.protect(jwt.sign({ id: h.row._id }, TEST_SECRET))).status, 401);
  assert.equal((await h.protect(jwt.sign({ id: h.row._id, sessionVersion: 0, purpose: "login" }, TEST_SECRET))).status, 401);
  assert.equal((await h.protect(h.auth.generateToken(h.row._id, h.row.role, 0))).next, true);
});

test("password reset OTP consumption and failed attempt count are atomic", async () => {
  const h = harness(); const code = security.otp();
  h.row.resetPasswordOtp = security.hash(code); h.row.resetPasswordOtpAttempts = 0; h.row.resetPasswordOtpExpires = new Date(Date.now() + 60000);
  const outcomes = await Promise.allSettled([1, 2].map(() => h.auth.verifyPasswordResetOtp({ email: h.row.email, otp: code })));
  assert.equal(outcomes.filter((v) => v.status === "fulfilled").length, 1);
  assert.equal(h.row.resetPasswordOtp, undefined);
  assert.equal(h.row.resetPasswordToken, security.hash(outcomes.find((v) => v.status === "fulfilled").value.resetToken));
});

test("fresh password-reset OTP is securely stored and produces a working one-time reset", async () => {
  const h = harness();
  await h.auth.sendPasswordResetOtp(h.row.email);
  assert.match(h.emails[0].otp, /^\d{6}$/);
  assert.equal(h.row.resetPasswordOtp, security.hash(h.emails[0].otp));
  const result = await h.auth.verifyPasswordResetOtp({ email: h.row.email, otp: h.emails[0].otp });
  await h.auth.resetPassword({ token: result.resetToken, newPassword: "AnotherStrongPassword123" });
  assert.equal(h.row.sessionVersion, 1);
});

test("registration code is consumed once and cannot create an attorney role", async () => {
  const h = harness(); const code = security.otp();
  const pending = { _id: "pending-synthetic", email: "new@example.invalid", otp: security.hash(code),
    attempts: 0, expiresAt: new Date(Date.now() + 60000), fullName: "Synthetic Client" };
  let consumed = false; let created = 0;
  const auth = h.load("services/authService.js", {
    "../models/PendingRegistration": {
      async findOneAndUpdate(filter) {
        if (consumed || !matches(pending, filter)) return null;
        pending.attempts++; return { ...pending };
      },
      async deleteOne(filter) {
        if (consumed || !matches(pending, filter)) return { deletedCount: 0 };
        consumed = true; return { deletedCount: 1 };
      },
    },
    "../models/User": { findOne: async () => null, create: async (fields) => { created++; return { ...fields, _id: "registered-synthetic", sessionVersion: 0 }; } },
  });
  const values = { email: pending.email, fullName: pending.fullName, password: PASSWORD, otp: code, role: "attorney" };
  const outcomes = await Promise.allSettled([auth.registerClient(values), auth.registerClient(values)]);
  assert.equal(created, 1);
  const result = outcomes.find((v) => v.status === "fulfilled").value;
  assert.equal(result.user.role, "client");
  assert.equal(jwt.verify(result.token, TEST_SECRET).purpose, "access");
});

test("invalid input cannot write credentials or issue challenges", async () => {
  const h = harness();
  await assert.rejects(h.auth.login({ email: { $ne: null }, password: PASSWORD }));
  await assert.rejects(h.auth.updateProfile(h.row._id, { newPassword: "short", currentPassword: PASSWORD }, 0));
  await assert.rejects(h.auth.updateProfile(h.row._id, { notificationSettings: { emailNotifications: "false" } }, 0));
  await assert.rejects(h.auth.updateProfile(h.row._id, { fullName: "Changed" }, undefined));
  assert.equal(h.writes.length, 0); assert.equal(h.emails.length, 0);
});


test("profile edits are persisted and returned without credentials for both roles", async () => {
  for (const role of ["client", "attorney"]) {
    const h = harness({ role });
    const saved = await h.auth.updateProfile(h.row._id, { fullName: "  Updated Synthetic Owner  ", contactNumber: "09123456789" }, 0);
    assert.equal(saved.fullName, "Updated Synthetic Owner");
    assert.equal(h.row.fullName, saved.fullName);
    assert.equal(h.row.contactNumber, saved.contactNumber);
    assert.equal(saved.password, undefined);
    const reread = security.publicUser(h.row);
    assert.equal(reread.fullName, saved.fullName);
    assert.equal(reread.contactNumber, "09123456789");
  }
});

test("independent notification saves preserve names and concurrent preference changes", async () => {
  const h = harness({ notificationSettings: { emailNotifications: true, inAppNotifications: true } });
  await Promise.all([
    h.auth.updateProfile(h.row._id, { notificationSettings: { emailNotifications: false } }, 0),
    h.auth.updateProfile(h.row._id, { notificationSettings: { inAppNotifications: false } }, 0),
  ]);
  assert.equal(h.row.notificationSettings.emailNotifications, false);
  assert.equal(h.row.notificationSettings.inAppNotifications, false);
  assert.equal(h.row.fullName, "Synthetic Owner");
  assert.equal(h.writes[0].changes.$set["notificationSettings.emailNotifications"], false);
  assert.equal(h.writes[1].changes.$set["notificationSettings.inAppNotifications"], false);
  await assert.rejects(h.auth.updateProfile(h.row._id, { notificationSettings: { emailNotifications: "false" } }, 0));
});

test("profile read returns fresh protected account data with no-store and safe fields", async () => {
  const h = harness({ fullName: "Fresh Synthetic Name", rollNumber: "synthetic-roll" });
  const controller = h.load("controllers/authController.js", {
    "express-validator": { validationResult: () => ({ isEmpty: () => true }) },
    "../services/authService": h.auth,
    "../services/authSecurity": security,
    "../services/auditService": { logAction: async () => {} },
  });
  let payload; const headers = {};
  const res = { setHeader: (key, value) => { headers[key] = value; }, status(code) { assert.equal(code, 200); return this; }, json(value) { payload = value; } };
  await controller.getProfile({ user: h.row }, res);
  assert.equal(payload.user.fullName, "Fresh Synthetic Name");
  assert.equal(payload.user.rollNumber, "synthetic-roll");
  assert.equal(payload.user.password, undefined);
  assert.equal(payload.user.sessionVersion, undefined);
  assert.match(headers["Cache-Control"], /no-store/);
});


test("HTTP profile updates survive a fresh GET for both roles and reject invalid sessions", async () => {
  const express = require("express");
  const h = harness();
  const controller = h.load("controllers/authController.js", {
    "express-validator": require("express-validator"), "../services/authService": h.auth,
    "express-async-handler": require("express-async-handler"),
    "../services/authSecurity": security, "../services/auditService": { logAction: async () => {} },
  });
  const routes = h.load("routes/authRoutes.js", {
    express, "express-validator": require("express-validator"),
    "../controllers/authController": controller, "../middleware/auth": h.load("middleware/auth.js", { "express-async-handler": require("express-async-handler") }),
  });
  const app = express(); app.use(express.json()); app.use("/api/auth", routes);
  app.use((error, req, res, next) => res.status(error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500)).json({ message: error.message }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  const url = `http://127.0.0.1:${server.address().port}/api/auth/profile`;
  const token = jwt.sign({ id: h.row._id, purpose: "access", sessionVersion: 0 }, TEST_SECRET, { expiresIn: "1m" });
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  try {
    for (const role of ["client", "attorney"]) {
      h.row.role = role;
      const updated = await fetch(url, { method: "PUT", headers, body: JSON.stringify({ fullName: `Updated ${role}`, contactNumber: "09123456789" }) });
      assert.equal(updated.status, 200);
      const written = await updated.json(); assert.equal(written.user.fullName, `Updated ${role}`);
      const read = await fetch(url, { headers }); assert.equal(read.status, 200);
      const persisted = await read.json(); assert.equal(persisted.user.fullName, written.user.fullName);
      assert.equal(persisted.user.contactNumber, "09123456789");
      assert.equal(persisted.user.password, undefined); assert.match(read.headers.get("cache-control"), /no-store/);
    }
    assert.equal((await fetch(url)).status, 401);
    const other = jwt.sign({ id: "other-synthetic-user", purpose: "access", sessionVersion: 0 }, TEST_SECRET);
    assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${other}` } })).status, 401);
    h.row.sessionVersion = 1;
    assert.equal((await fetch(url, { headers })).status, 401);
    const rejected = await fetch(url, { method: "PUT", headers, body: JSON.stringify({ fullName: "Must not persist" }) });
    assert.equal(rejected.status, 401); assert.equal(h.row.fullName, "Updated attorney");
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});


test("only completed OTP login renews a client in the annual expiry warning period", async () => {
  const expires = new Date(Date.now() + 5 * 86400000);
  const h = harness({ accountExpiresAt: expires, accountWarningSentAt: new Date(), accountDeleteAfter: expires });
  const challenge = await h.login();
  assert.equal(+h.row.accountExpiresAt, +expires);
  await assert.rejects(h.auth.verifyLogin2FA({ email: h.row.email, otp: "000000", challengeId: challenge.challengeId }));
  assert.equal(+h.row.accountExpiresAt, +expires);
  await h.auth.verifyLogin2FA({ email: h.row.email, otp: h.emails[0].otp, challengeId: challenge.challengeId });
  assert.ok(+h.row.accountExpiresAt > Date.now() + 364 * 86400000);
  assert.equal(h.row.accountWarningSentAt, null); assert.equal(h.row.accountDeleteAfter, null);
});


test("automatic deletion requires storage confirmation before removing contracts, sessions or the account", async () => {
  const h = harness(); const removed = [];
  const deps = {
    "../models/User": { findById: async () => ({ _id: "client", role: "client" }), findByIdAndDelete: async () => removed.push("user") },
    "../models/Contract": { find: async () => [{ _id: "contract", fileType: "pdf", cloudinaryPublicId: "synthetic", cloudinaryDeliveryType: "authenticated" }], deleteMany: async () => removed.push("contracts") },
    "../models/ContractFlag": { deleteMany: async () => removed.push("flags") },
    "../models/Notification": { deleteMany: async () => removed.push("notifications") },
    "../models/AccessSession": { deleteMany: async () => removed.push("sessions") },
  };
  const failed = h.load("services/authService.js", { ...deps, "./cloudinaryService": { deleteFromCloudinary: async () => ({ result: "error" }) } });
  await assert.rejects(failed.deleteAccount("client", { strictStorage: true }), /not confirmed/);
  assert.deepEqual(removed, []);
  const success = h.load("services/authService.js", { ...deps, "./cloudinaryService": { deleteFromCloudinary: async (_id, type, delivery) => {
    assert.equal(type, "raw"); assert.equal(delivery, "authenticated"); return { result: "not found" };
  } } });
  await success.deleteAccount("client", { strictStorage: true });
  assert.deepEqual(removed, ["flags", "notifications", "contracts", "sessions", "user"]);
});
