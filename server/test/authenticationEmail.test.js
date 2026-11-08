const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function harness({ configured = false, fail = false, mode = "development", service = false, failureCode } = {}) {
  const logs = [];
  const messages = [];
  const transports = [];
  const context = { module: { exports: {} },
    process: { env: { NODE_ENV: mode, ...(configured ? {
      ...(service ? { EMAIL_SERVICE: "gmail" } : { SMTP_HOST: "smtp.example.invalid" }),
      SMTP_USER: "synthetic", SMTP_PASS: "SYNTHETIC_SECRET",
    } : {}) } },
    console: Object.fromEntries(["log", "warn", "error"].map(key => [key, (...args) => logs.push(args.join(" "))])),
    require(name) {
      if (name === "../utils/securityUtils") return require("../src/utils/securityUtils");
      if (name === "nodemailer") return { createTransport: options => {
        transports.push(options);
        return { sendMail: async message => {
          if (fail) throw Object.assign(new Error("SMTP failure contains 123456 SYNTHETIC_SECRET owner@example.invalid"), { code: failureCode });
          messages.push(message); return { messageId: "synthetic" };
        } };
      } };
      throw new Error(`ISOLATION VIOLATION: ${name}`);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/services/emailService.js"), "utf8"), context);
  return { service: context.module.exports, logs, messages, transports };
}

test("authentication mail never falls back to secret-bearing logs, in any runtime mode", async () => {
  for (const mode of ["development", "test", "production"]) {
    for (const configured of [false, true]) {
      const h = harness({ mode, configured, fail: true });
      await assert.rejects(h.service.sendOtpEmail({ toEmail: "owner@example.invalid", fullName: "Synthetic Owner", otp: "123456" }), /Email delivery unavailable/);
      await assert.rejects(h.service.sendPasswordResetEmail({ toEmail: "owner@example.invalid", resetUrl: "https://example.invalid/reset?token=SECRET_TOKEN" }), /Email delivery unavailable/);
      assert.doesNotMatch(h.logs.join("\n"), /123456|SECRET_TOKEN|SYNTHETIC_SECRET|owner@example.invalid|Synthetic Owner/);
    }
  }
});

test("reset email sends the token only to the intended recipient with a safe HTML link", async () => {
  const h = harness({ configured: true });
  const url = "https://example.invalid/reset?token=synthetic&other=value";
  assert.equal((await h.service.sendPasswordResetEmail({ toEmail: "owner@example.invalid", resetUrl: url })).delivered, true);
  assert.equal(h.messages[0].to, "owner@example.invalid");
  assert.ok(h.messages[0].text.includes(url));
  assert.ok(h.messages[0].html.includes("&amp;other=value"));
  assert.equal(h.logs.length, 0);
});

test("both SMTP configuration paths use explicit stage and inactivity timeouts", async () => {
  for (const service of [false, true]) {
    const h = harness({ configured: true, service });
    const result = await h.service.sendOtpEmail({ toEmail: "owner@example.invalid", otp: "123456" });
    assert.equal(result.success, true);
    assert.equal(result.messageId, "synthetic");
    assert.equal(h.messages.length, 1);
    assert.equal(h.transports[0].connectionTimeout, 10000);
    assert.equal(h.transports[0].greetingTimeout, 10000);
    assert.equal(h.transports[0].socketTimeout, 20000);
    assert.match(h.logs.join("\n"), /outcome=accepted elapsedMs=\d+/);
    assert.doesNotMatch(h.logs.join("\n"), /123456|owner@example.invalid|SYNTHETIC_SECRET/);
  }
});

test("SMTP failures return temporary unavailability and only allowlisted error categories", async () => {
  for (const code of ["ETIMEDOUT", "ECONNECTION", "EAUTH", "SECRET_TOKEN owner@example.invalid"]) {
    const h = harness({ configured: true, fail: true, failureCode: code });
    await assert.rejects(h.service.sendOtpEmail({ toEmail: "owner@example.invalid", otp: "123456" }),
      error => error.statusCode === 503 && error.message === "Email delivery unavailable. Please try again later.");
    assert.equal(h.messages.length, 0);
    const logs = h.logs.join("\n");
    assert.match(logs, /outcome=failed category=(ETIMEDOUT|ECONNECTION|EAUTH|OTHER) elapsedMs=\d+/);
    assert.doesNotMatch(logs, /123456|SECRET_TOKEN|SYNTHETIC_SECRET|owner@example.invalid|SMTP failure/);
  }
});
