// This child receives no database credentials or Cloudinary/email secrets.
process.once("message", async ({ buffer, mimeType, validationOnly }) => {
  try {
    if (validationOnly) {
      await require("../utils/documentIntegrity").validateDocumentContent(Buffer.from(buffer), mimeType);
      process.send({ ok: true, result: { text: "", method: "direct", flaggedForReview: false } });
      return;
    }
    const processor = require("./documentProcessor");
    const result = mimeType === "application/pdf"
      ? await processor.processDocument(Buffer.from(buffer))
      : await processor.processImage(Buffer.from(buffer));
    process.send({ ok: true, result });
  } catch (error) {
    // Do not return native errors, private document content, paths or storage URLs.
    process.send({ ok: false, code: error.name === "PasswordException" ? "encrypted" : error.validationCode || "invalid" });
  }
  // Parent terminates the entire process group/tree, including native converters.
});
process.once("disconnect", () => {
  // Parent restart must not leave a native converter running without supervision.
  require("./documentProcessingService").terminateTree({ pid: process.pid, exitCode: null,
    kill: () => process.exit(1) }).catch(() => process.exit(1));
});
