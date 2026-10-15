// This child receives no database credentials or Cloudinary/email secrets.
process.once("message", async ({ buffer, mimeType }) => {
  try {
    const processor = require("./documentProcessor");
    const result = mimeType === "application/pdf"
      ? await processor.processDocument(Buffer.from(buffer))
      : await processor.processImage(Buffer.from(buffer));
    process.send({ ok: true, result });
  } catch {
    // Do not return native errors, private document content, paths or storage URLs.
    process.send({ ok: false });
  }
  // Parent terminates the entire process group/tree, including native converters.
});
process.once("disconnect", () => {
  // Parent restart must not leave a native converter running without supervision.
  require("./documentProcessingService").terminateTree({ pid: process.pid, exitCode: null,
    kill: () => process.exit(1) }).catch(() => process.exit(1));
});
