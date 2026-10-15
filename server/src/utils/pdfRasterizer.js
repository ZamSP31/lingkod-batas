const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const run = promisify(execFile);
const executable = process.platform === "linux" ? "pdftocairo"
  : path.join(require("pdf-poppler").path, "pdftocairo");

module.exports = {
  async convert(file, options) {
    const args = ["-png", "-scale-to", "1024", "-f", String(options.page || 1), "-l", String(options.page || options.lastPage || 50)];
    args.push(file, path.join(options.out_dir, options.out_prefix));
    await run(executable, args, { maxBuffer: 1024 * 1024, timeout: 45000, killSignal: "SIGKILL", windowsHide: true });
  },
};
