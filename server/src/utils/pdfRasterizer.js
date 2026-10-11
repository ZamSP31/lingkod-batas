const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

// pdf-poppler exits the process when imported on Linux. Use system Poppler there.
if (process.platform !== "linux") {
  module.exports = require("pdf-poppler");
} else {
  const run = promisify(execFile);
  module.exports = {
    async convert(file, options) {
      const args = ["-png", "-scale-to", "1024"];
      if (options.page) args.push("-f", String(options.page), "-l", String(options.page));
      args.push(file, path.join(options.out_dir, options.out_prefix));
      await run("pdftocairo", args, { maxBuffer: 5000 * 1024 });
    },
  };
}
