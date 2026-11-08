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
  const logs = [];
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
      "../utils/consent": require("../src/utils/consent"),
      "../services/sessionActivity": { checkSessionActivity: async () => true },
      "../models/AccessSession": {}, "../models/User": User,
      "../models/PendingRegistration": {}, "../models/Contract": {}, "../models/ContractFlag": {}, "../models/Notification": {},
      "./cloudinaryService": {}, "./emailService": {
        sendOtpEmail: async (mail) => { emails.push(mail); },
        sendPasswordResetEmail: async (mail) => { emails.push(mail); },
      }, ...additional };
    const context = { module: { exports: {} }, process: { env: { JWT_SECRET: TEST_SECRET, NODE_ENV: "production" } },
      console: { log: (...args) => logs.push(args.join(" ")) },
      require(name) { if (!(name in deps)) throw new Error(`ISOLATION VIOLATION: ${name}`); return deps[name]; } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src", relative), "utf8"), context);
    return context.module.exports;
  }
  return { row, emails, writes, logs, load, auth: load("services/authService.js"),
    async login() { return this.auth.login({ email: row.email, password: PASSWORD }); },
    async protect(token) {
      const middleware = load("middleware/auth.js").protect;
      let status = 200; let next = false; let error;
      try { await middleware({ headers: { authorization: `Bearer ${token}` } }, { status(value) { status = value; } }, () => { next = true; }); } catch (caught) { error = caught; }
      return { status, next, error };
    } };
}

test("login waits for mail acceptance and emits timings without credentials or challenge values", async () => {
  const h = harness();
  let release;
  const pendingMail = new Promise(resolve => { release = resolve; });
  let sending;
  const mailStarted = new Promise(resolve => { sending = resolve; });
  const auth = h.load("services/authService.js", { "./emailService": {
    sendOtpEmail: async () => { sending(); await pendingMail; },
  } });
  let settled = false;
  const login = auth.login({ email: h.row.email, password: PASSWORD }).then(result => { settled = true; return result; });
  await mailStarted;
  assert.equal(settled, false);
  assert.match(h.logs.at(-1), /stage=otp_email outcome=started/);
  release();
  const result = await login;
  assert.equal(result.requires2FA, true);
  for (const stage of ["user_lookup", "password_verification", "challenge_save", "otp_email"]) {
    assert.ok(h.logs.some(line => line.includes(`stage=${stage} outcome=completed elapsedMs=`)));
  }
  const logs = h.logs.join("\n");
  for (const secret of [PASSWORD, h.row.password, h.row.email, h.row.fullName, result.challengeId, h.row.twoFactorOtp]) {
    assert.equal(logs.includes(secret), false);
  }
});

test("mail failure rejects login instead of reporting successful dispatch", async () => {
  const h = harness();
  const failure = Object.assign(new Error("Email delivery unavailable. Please try again later."), { statusCode: 503 });
  const auth = h.load("services/authService.js", { "./emailService": {
    sendOtpEmail: async () => { throw failure; },
  } });
  await assert.rejects(auth.login({ email: h.row.email, password: PASSWORD }), error => error === failure);
  assert.match(h.logs.at(-1), /stage=otp_email outcome=failed elapsedMs=\d+/);
});

test("login controller waits for audit settlement and propagates safe mail failures as HTTP 503", async () => {
  for (const fail of [false, true]) {
    const h = harness();
    let release;
    let started;
    const pendingAudit = new Promise(resolve => { release = resolve; });
    const auditStarted = new Promise(resolve => { started = resolve; });
    const failure = Object.assign(new Error("Email delivery unavailable. Please try again later."), { statusCode: 503 });
    let auditCalls = 0;
    const controller = h.load("controllers/authController.js", {
      "express-validator": { validationResult: () => ({ isEmpty: () => true }) },
      "../services/authSecurity": {},
      "../services/authService": { login: async () => {
        if (fail) throw failure;
        return { requires2FA: true, userId: h.row._id, userEmail: h.row.email };
      } },
      "../services/auditService": { logAction: async () => { auditCalls++; started(); await pendingAudit; } },
    });
    let status = 200;
    let body;
    const res = { status(value) { status = value; return this; }, json(value) { body = value; } };
    const req = { body: { email: h.row.email, password: PASSWORD } };
    const request = controller.login(req, res);
    if (fail) {
      await assert.rejects(request, error => error === failure);
      assert.equal(auditCalls, 0);
      const { errorHandler } = h.load("middleware/errorHandler.js");
      errorHandler(failure, req, { ...res, statusCode: 200 });
      assert.equal(status, 503);
      assert.equal(body.message, failure.message);
    } else {
      await auditStarted;
      assert.equal(body, undefined);
      release();
      await request;
      assert.equal(status, 200);
      assert.equal(body.requires2FA, true);
      assert.match(h.logs.at(-1), /stage=audit_write outcome=settled elapsedMs=\d+/);
      assert.equal(h.logs.join("\n").includes(h.row.email), false);
    }
  }
});

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

test("reset-link requests deliver a one-time token by email without returning it to the caller", async () => {
  const h = harness();
  const result = await h.auth.requestPasswordReset(h.row.email);
  assert.equal(h.emails.length, 1);
  const token = new URL(h.emails[0].resetUrl).searchParams.get("token");
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(h.row.resetPasswordToken, security.hash(token));
  assert.equal(result.resetToken, undefined);
  assert.equal(result.resetUrl, undefined);
  await h.auth.resetPassword({ token, newPassword: "AnotherStrongPassword123" });
  await assert.rejects(h.auth.resetPassword({ token, newPassword: "AnotherStrongPassword123" }), /invalid or has expired/);
});

test("reset-link delivery failure cannot claim that mail was dispatched", async () => {
  const h = harness();
  const auth = h.load("services/authService.js", {
    "./emailService": { sendPasswordResetEmail: async () => { throw new Error("Email delivery unavailable."); } },
  });
  await assert.rejects(auth.requestPasswordReset(h.row.email), /Email delivery unavailable/);
});

test("registration code is consumed once and cannot create an attorney role", async () => {
  const h = harness(); const code = security.otp();
  const pending = { _id: "pending-synthetic", email: "new@example.invalid", otp: security.hash(code),
    attempts: 0, expiresAt: new Date(Date.now() + 60000), fullName: "Synthetic Client" };
  let consumed = false; let created = 0; let createdFields;
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
    "../models/User": { findOne: async () => null, create: async (fields) => { created++; createdFields = fields; return { ...fields, _id: "registered-synthetic", sessionVersion: 0 }; } },
  });
  const values = { email: pending.email, fullName: pending.fullName, password: PASSWORD, otp: code, role: "attorney",
    consentAccepted: true, consentVersion: "2026-10-31" };
  const outcomes = await Promise.allSettled([auth.registerClient(values), auth.registerClient(values)]);
  assert.equal(created, 1);
  const result = outcomes.find((v) => v.status === "fulfilled").value;
  assert.equal(result.user.role, "client");
  assert.equal(createdFields.consentVersion, "2026-10-31");
  assert.ok(createdFields.consentAcceptedAt instanceof Date || Number.isFinite(+createdFields.consentAcceptedAt));
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

test("all new-password paths reject oversized, multibyte-truncated and weak passwords before writes", async () => {
  for (const password of [null, {}, "short", "lowercaseonly123", "UppercaseOnly", "Aa1" + "x".repeat(48), "Aa1" + "é".repeat(35)]) {
    const h = harness();
    await assert.rejects(h.auth.registerClient({ email: "new@example.invalid", fullName: "Synthetic", password, otp: "123456" }), /Password/);
    await assert.rejects(h.auth.resetPassword({ token: "a".repeat(64), newPassword: password }), /Password/);
    await assert.rejects(h.auth.updateProfile(h.row._id, { newPassword: password, currentPassword: PASSWORD }, 0), /Password/);
    assert.equal(h.writes.length, 0);
    assert.equal(h.emails.length, 0);
  }
  assert.doesNotThrow(() => security.validateNewPassword("Aa1" + "é".repeat(34) + "b"));
  assert.doesNotThrow(() => security.validateNewPassword("Aa1" + "x".repeat(47)));
});

test("registration requires current consent before consuming a code or creating an account", async () => {
  for (const consent of [{}, { consentAccepted: false, consentVersion: "2026-10-31" },
    { consentAccepted: true, consentVersion: "old" }, { consentAccepted: {}, consentVersion: "2026-10-31" }]) {
    const h = harness();
    await assert.rejects(h.auth.registerClient({ fullName: "Synthetic", email: "new@example.invalid", password: PASSWORD, otp: "123456", ...consent }), /current terms/);
    assert.equal(h.writes.length, 0);
  }
});

test("self-deletion disables access, retains references after storage failure, and can resume", async () => {
  const h = harness();
  let user = { _id: "client", role: "client", isActive: true, sessionVersion: 0, accountDeletionStartedAt: null };
  let contracts = [{ _id: "contract", cloudinaryPublicId: "synthetic", fileType: "pdf" }];
  let storageFails = true; const removed = [];
  const auth = h.load("services/authService.js", {
    "../models/User": {
      findOneAndUpdate: async filter => {
        if (!user?.isActive || user.role !== filter.role) return null;
        user = { ...user, isActive: false, sessionVersion: 1, accountDeletionStartedAt: new Date() };
        return user;
      },
      findById: async () => user,
      db: { transaction: async operation => operation("synthetic-session") },
      deleteOne: async (_filter, { session }) => { assert.equal(session, "synthetic-session"); user = null; removed.push("user"); return { deletedCount: 1 }; },
    },
    "../models/Contract": { find: async () => contracts, deleteMany: async () => { contracts = []; removed.push("contracts"); } },
    "../models/ContractFlag": { deleteMany: async () => removed.push("flags") },
    "../models/Notification": { deleteMany: async () => removed.push("notifications") },
    "../models/AccessSession": { deleteMany: async () => removed.push("sessions") },
    "./cloudinaryService": { deleteFromCloudinary: async () => ({ result: storageFails ? "error" : "ok" }) },
  });
  const pending = await auth.requestAccountDeletion("client");
  assert.equal(pending.pending, true);
  assert.equal(user.isActive, false); assert.equal(user.sessionVersion, 1);
  assert.ok(user.accountDeletionStartedAt);
  assert.equal(contracts.length, 1); assert.deepEqual(removed, []);
  await assert.rejects(auth.requestAccountDeletion("client"), /already requested/);
  storageFails = false;
  await auth.deleteAccount("client");
  assert.equal(user, null); assert.equal(contracts.length, 0);
  assert.deepEqual(removed, ["flags", "notifications", "contracts", "sessions", "user"]);
});

test("login preserves safe legacy passwords but never accepts a suffix ignored by bcrypt", async () => {
  const legacy = "a".repeat(72);
  const h = harness({ password: bcrypt.hashSync(legacy, 4) });
  assert.equal((await h.auth.login({ email: h.row.email, password: legacy })).requires2FA, true);
  const writes = h.writes.length;
  for (const password of [legacy + "X", legacy + "Y", "é".repeat(37)]) {
    await assert.rejects(h.auth.login({ email: h.row.email, password }), /password recovery/);
  }
  assert.equal(h.writes.length, writes);
  assert.equal(h.emails.length, 1);
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
  app.use((error, req, res, _next) => res.status(error.statusCode || (res.statusCode >= 400 ? res.statusCode : 500)).json({ message: error.message }));
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
  let failNotifications = false;
  const remove = name => async (_filter, { session }) => {
    assert.equal(session, "synthetic-session");
    if (name === "notifications" && failNotifications) throw new Error("Synthetic database failure");
    removed.push(name); return { deletedCount: 1 };
  };
  const deps = {
    "../models/User": { findById: async () => ({ _id: "client", role: "client", isActive: false, accountDeletionStartedAt: new Date() }),
      db: { transaction: async operation => {
        const before = removed.length;
        try { return await operation("synthetic-session"); }
        catch (error) { removed.splice(before); throw error; }
      } },
      deleteOne: remove("user") },
    "../models/Contract": { find: async () => [{ _id: "contract", fileType: "pdf", cloudinaryPublicId: "synthetic", cloudinaryDeliveryType: "authenticated" }], deleteMany: remove("contracts") },
    "../models/ContractFlag": { deleteMany: remove("flags") },
    "../models/Notification": { deleteMany: remove("notifications") },
    "../models/AccessSession": { deleteMany: remove("sessions") },
  };
  const failed = h.load("services/authService.js", { ...deps, "./cloudinaryService": { deleteFromCloudinary: async () => ({ result: "error" }) } });
  await assert.rejects(failed.deleteAccount("client", { strictStorage: true }), /not confirmed/);
  assert.deepEqual(removed, []);
  const success = h.load("services/authService.js", { ...deps, "./cloudinaryService": { deleteFromCloudinary: async (_id, type, delivery) => {
    assert.equal(type, "raw"); assert.equal(delivery, "authenticated"); return { result: "not found" };
  } } });
  failNotifications = true;
  await assert.rejects(success.deleteAccount("client"), /Synthetic database failure/);
  assert.deepEqual(removed, []);
  failNotifications = false;
  await success.deleteAccount("client", { strictStorage: true });
  assert.deepEqual(removed, ["flags", "notifications", "contracts", "sessions", "user"]);
});
