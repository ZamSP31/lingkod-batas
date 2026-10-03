/**
 * fileValidation.js
 * Inspects binary buffer headers (magic bytes) to prevent MIME-spoofing attacks (CWE-434).
 */

/**
 * Validates document buffer magic bytes against declared MIME type.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} mimetype - Declared MIME type
 * @returns {boolean} True if magic bytes match expected format
 */
function isValidDocumentBuffer(buffer, mimetype) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
    return false;
  }

  // PDF magic bytes: %PDF (hex: 25 50 44 46)
  if (mimetype === "application/pdf") {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (mimetype === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // JPEG magic bytes: FF D8 FF
  if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  // Plain text (for statutory corpus imports)
  if (mimetype === "text/plain") {
    // Text files must not contain binary null bytes in the first 1KB
    const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
    return !sample.includes(0x00);
  }

  return false;
}

module.exports = {
  isValidDocumentBuffer,
};
