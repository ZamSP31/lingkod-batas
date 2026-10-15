const MAX_BYTES = 20 * 1024 * 1024;
const MAX_PAGES = 50;
const MAX_PIXELS = 20000000;
const MAX_DIMENSION = 12000;
const MAX_TEXT = 250000;
const TIMEOUT_MS = 120000;

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 422;
  throw error;
}

function dimensions(width, height) {
  if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) {
    invalid("Image exceeds the 20-megapixel or 12000-pixel dimension limit.");
  }
  return { width, height };
}

function validateImage(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    if (buffer.toString("ascii", 12, 16) !== "IHDR") invalid("Invalid PNG header.");
    const result = dimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20));
    for (let offset = 8; offset + 12 <= buffer.length;) {
      const size = buffer.readUInt32BE(offset);
      if (offset + size + 12 > buffer.length) invalid("Invalid PNG chunk.");
      if (buffer.toString("ascii", offset + 4, offset + 8) === "acTL") invalid("Animated PNG files are not supported.");
      offset += size + 12;
    }
    return result;
  }
  if (buffer[0] === 255 && buffer[1] === 216) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset++] !== 255) invalid("Invalid JPEG header.");
      while (buffer[offset] === 255) offset++;
      const marker = buffer[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > buffer.length) break;
      const size = buffer.readUInt16BE(offset);
      if (size < 2 || offset + size > buffer.length) invalid("Invalid JPEG segment.");
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) {
        if (size < 8) invalid("Invalid JPEG dimensions.");
        return dimensions(buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3));
      }
      offset += size;
    }
  }
  invalid("Image dimensions could not be validated.");
}

function validateInput(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > MAX_BYTES) invalid("Document exceeds the 20MB limit or is empty.");
  if (mimeType === "application/pdf") {
    if (buffer.toString("ascii", 0, 4) !== "%PDF") invalid("Invalid PDF signature.");
  } else if (["image/png", "image/jpeg", "image/jpg"].includes(mimeType)) {
    validateImage(buffer);
  } else invalid("Unsupported processing document type.");
}

function validatePages(total) {
  if (!Number.isInteger(total) || total < 1 || total > MAX_PAGES) invalid("PDF must contain between 1 and 50 pages.");
}
function validateText(text) {
  if (typeof text !== "string" || text.length > MAX_TEXT) invalid("Extracted text exceeds the processing limit.");
  return text;
}

module.exports = { MAX_BYTES, MAX_PAGES, MAX_TEXT, TIMEOUT_MS, validateInput, validateImage, validatePages, validateText };
