// Safe replacement for the former Atlas-mutating stress test.
// Uses synthetic adapters; this does not establish live MongoDB concurrency.
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const result = spawnSync(process.execPath, [
  "--test", path.join(__dirname, "../test/requestNumbers.test.js"),
], { stdio: "inherit", windowsHide: true });

if (result.error || result.signal) {
  console.error("The isolated counter checks could not finish.");
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
