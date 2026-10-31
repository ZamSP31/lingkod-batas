const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function harness({ configured = false, fail = false, mode = "development" } = {}) {
  const logs = [];
  const messages = [];
  const context = { module: { exports: {} },
    process: { env: { NODE_ENV: mode, ...(configured ? {
      SMTP_HOST: "smtp.example.invalid", SMTP_USER: "synthetic", SMTP_PASS: "SYNTHETIC_SECRET",
    } : {}) } },
    console: Object.fromEntries(["log", "warn", "error"].map(key => [key, (...args) => logs.push(args.join(" "))])),
    require(name) {
      if (name === "../utils/securityUtils") return require("../src/utils/securityUtils");
      if (name === "nodemailer") return { createTransport: () => ({ sendMail: async message => {
        if (fail) throw new Error("SMTP failure contains 123456 SYNTHETIC_SECRET owner@example.invalid");
        messages.push(message); return { messageId: "synthetic" };
      } }) };
      throw new Error(`ISOLATION VIOLATION: ${name}`);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/services/emailService.js"), "utf8"), context);
  return { service: context.module.exports, logs, messages };
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
