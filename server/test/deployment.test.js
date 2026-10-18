const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("Linux rasterizer avoids pdf-poppler and safely passes file paths as arguments", async () => {
  const calls = [];
  const source = fs.readFileSync(path.join(__dirname, "../src/utils/pdfRasterizer.js"), "utf8");
  const context = {
    module: { exports: {} },
    process: { platform: "linux" },
    require(name) {
      if (name === "node:path") return path;
      if (name === "node:util") return require(name);
      if (name === "node:child_process") return {
        execFile(file, args, options, callback) {
          calls.push({ file, args, options });
          callback(null, "", "");
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(source, context);
  await context.module.exports.convert("synthetic file;name.pdf", { out_dir: "scratch", out_prefix: "page", page: null });
  assert.equal(calls[0].file, "pdftocairo");
  assert.deepEqual(Array.from(calls[0].args), ["-png", "-scale-to", "1024", "-f", "1", "-l", "50", "synthetic file;name.pdf", path.join("scratch", "page")]);
  context.require = (name) => name === "node:child_process" ? {
    execFile(_file, _args, _options, callback) { callback(new Error("conversion failed")); },
  } : name === "pdf-poppler" ? null : require(name);
  const failingContext = { ...context, module: { exports: {} } };
  vm.runInNewContext(source, failingContext);
  await assert.rejects(failingContext.module.exports.convert("synthetic.pdf", { out_dir: "scratch", out_prefix: "page" }), /conversion failed/);
});

test("Windows rasterizer uses bundled executable with timeout and argument arrays", async () => {
  let invocation;
  const context = { module: { exports: {} }, process: { platform: "win32" }, require(name) {
    if (name === "pdf-poppler") return { path: "synthetic-poppler" };
    if (name === "node:child_process") return { execFile(file, args, options, callback) { invocation = { file, args, options }; callback(null, "", ""); } };
    return require(name);
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/utils/pdfRasterizer.js"), "utf8"), context);
  await context.module.exports.convert("synthetic.pdf", { out_dir: "scratch", out_prefix: "page", lastPage: 50 });
  assert.equal(invocation.file, path.join("synthetic-poppler", "pdftocairo"));
  assert.equal(invocation.options.timeout, 45000); assert.equal(invocation.options.killSignal, "SIGKILL");
  assert.equal(invocation.options.windowsHide, true);
});

test("Production email failure never logs an OTP or simulates delivery", async () => {
  const logs = [];
  const context = {
    module: { exports: {} },
    process: { env: { NODE_ENV: "production" } },
    console: { log: (...args) => logs.push(args), warn() {}, error() {} },
    require(name) {
      if (name === "nodemailer") return { createTransport() { throw new Error("Unexpected transport"); } };
      if (name === "../utils/securityUtils") return { escapeHtml: (value) => value || "" };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../src/services/emailService.js"), "utf8"), context);
  await assert.rejects(context.module.exports.sendOtpEmail({ toEmail: "synthetic@example.invalid", otp: "000000", fullName: "Synthetic" }), /Email delivery unavailable/);
  assert.deepEqual(logs, []);
});

test("Production health, explicit CORS and missing-token protection work without external services", async () => {
  process.env.NODE_ENV = "production";
  process.env.CLIENT_URL = "https://synthetic-frontend.vercel.app";
  const app = require("../src/app");
  assert.equal(app.get("trust proxy"), 1);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, "ok");
    const allowed = await fetch(`${base}/api/contracts`, {
      method: "OPTIONS",
      headers: { Origin: process.env.CLIENT_URL, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type" },
    });
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get("access-control-allow-origin"), process.env.CLIENT_URL);
    for (const origin of ["https://unrelated.example", "http://localhost:5173"]) {
      const denied = await fetch(`${base}/api/health`, { headers: { Origin: origin } });
      assert.equal(denied.headers.get("access-control-allow-origin"), null);
    }
    const protectedResponse = await fetch(`${base}/api/contracts`);
    assert.equal(protectedResponse.status, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
