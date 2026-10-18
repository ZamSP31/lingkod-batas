const path = require("node:path");
const fs = require("node:fs/promises");
const { fork, execFile } = require("node:child_process");
const limits = require("../utils/documentLimits");

async function terminateTree(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    await new Promise((resolve, reject) => {
      const executable = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "taskkill.exe");
      execFile(executable, ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, timeout: 10000 }, (error) => {
        if (error) { child.kill("SIGKILL"); reject(new Error("Processing tree termination failed")); }
        else resolve();
      });
    });
  } else {
    try { process.kill(-child.pid, "SIGKILL"); }
    catch (error) { if (error.code !== "ESRCH") throw error; }
  }
}

function createDocumentRunner({ forkImpl = fork, killTree = terminateTree,
  timeoutMs = limits.TIMEOUT_MS, maxActive = 2, validationOnly: defaultValidationOnly = false,
  workerPath = path.join(__dirname, "documentWorker.js"),
  root = path.resolve(__dirname, "../../tmp/ocr"), makeDir = fs.mkdtemp,
  removeDir = (directory) => fs.rm(directory, { recursive: true, force: true }),
  ensureRoot = () => fs.mkdir(root, { recursive: true }) } = {}) {
  let active = 0;
  let terminationFailed = false;
  return async function processInput(buffer, mimeType, { signal, validationOnly = defaultValidationOnly } = {}) {
    if (validationOnly && mimeType === "text/plain") {
      require("../utils/documentIntegrity").validateTextFile(buffer);
      return { text: "", method: "direct", flaggedForReview: false };
    }
    limits.validateInput(buffer, mimeType);
    if (signal?.aborted) throw new Error("Document processing cancelled");
    if (terminationFailed || active >= maxActive) {
      const error = new Error("Document processor busy. Try again later."); error.statusCode = 503; throw error;
    }
    active++;
    let directory;
    try {
      await ensureRoot();
      directory = await makeDir(path.join(root, "job-"));
      const relative = path.relative(root, path.resolve(directory));
      if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Invalid processing directory");
      return await new Promise((resolve, reject) => {
        const env = {};
        for (const key of ["PATH", "Path", "SystemRoot", "WINDIR", "TEMP", "TMP", "TMPDIR", "LANG", "NODE_ENV"]) {
          if (process.env[key]) env[key] = process.env[key];
        }
        env.LB_PROCESSING_DIR = directory;
        let child;
        let timer;
        let finished = false;
        let closeResolve;
        const closed = new Promise((done) => { closeResolve = done; });
        const cancel = () => { void finish(new Error("Document processing cancelled")); };
        async function finish(error, result) {
          if (finished) return;
          finished = true;
          clearTimeout(timer); signal?.removeEventListener("abort", cancel);
          try {
            if (child) {
              await killTree(child);
              let exitTimer;
              try {
                await Promise.race([closed, new Promise((_, fail) => { exitTimer = setTimeout(() => fail(new Error("Processor did not exit")), 10000); })]);
              } finally { clearTimeout(exitTimer); }
            }
          } catch {
            terminationFailed = true; // Fail closed instead of accumulating orphan processors.
            error = new Error("Document processor could not be stopped; restart the server.");
          }
          if (error) reject(error); else resolve(result);
        }
        try {
          child = forkImpl(workerPath, [], { serialization: "advanced", detached: process.platform !== "win32",
            windowsHide: true, execArgv: ["--max-old-space-size=256"], cwd: directory, env,
            stdio: ["ignore", "ignore", "ignore", "ipc"] });
          child.once("close", () => { closeResolve(); if (!finished) void finish(new Error("Document processor exited unexpectedly")); });
          child.once("error", () => { closeResolve(); void finish(new Error("Document processor unavailable")); });
          child.once("message", (message) => {
            if (!message?.ok) {
              const messages = {
                encrypted: "Password-protected PDFs are not supported. Upload an unencrypted copy.",
                invalid: "The file is corrupted or unreadable. Upload a valid PDF, PNG, JPEG, or UTF-8 TXT file.",
                limits: "Document exceeds the supported page, text, or image limits.",
              };
              const error = new Error(validationOnly ? (messages[message?.code] || messages.invalid) : "Document could not be processed within the supported limits.");
              if (validationOnly) error.statusCode = 422;
              void finish(error); return;
            }
            try {
              limits.validateText(message.result?.text);
              if (!["direct", "tesseract", "cloud"].includes(message.result.method) || typeof message.result.flaggedForReview !== "boolean") throw new Error("Invalid processor output");
              void finish(null, message.result);
            } catch { void finish(new Error("Invalid document processor output")); }
          });
          timer = setTimeout(() => { void finish(new Error("Document processing exceeded the two-minute limit")); }, timeoutMs);
          signal?.addEventListener("abort", cancel, { once: true });
          if (signal?.aborted) cancel();
          else child.send({ buffer, mimeType, validationOnly }, (error) => { if (error) void finish(new Error("Document processor unavailable")); });
        } catch { closeResolve(); void finish(new Error("Document processor unavailable")); }
      });
    } finally {
      // Directory must resolve strictly inside our scratch root before removal.
      try {
        if (directory && !terminationFailed) {
          const relative = path.relative(root, path.resolve(directory));
          if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) await removeDir(directory);
        }
      } finally { active--; }
    }
  };
}

const run = createDocumentRunner();
module.exports = { createDocumentRunner, terminateTree,
  validateDocument: (buffer, mimeType, options) => run(buffer, mimeType, { ...options, validationOnly: true }),
  processDocument: (buffer, options) => run(buffer, "application/pdf", options),
  processImage: (buffer, options) => run(buffer, "image/jpeg", options) };
