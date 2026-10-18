const { TextDecoder } = require("node:util");
const { createRequire } = require("node:module");
const limits = require("./documentLimits");

function invalid(message, code = "invalid") {
  const error = new Error(message);
  error.statusCode = 422;
  error.validationCode = code;
  throw error;
}

function validateTextFile(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > limits.MAX_BYTES) {
    invalid("Text file is empty or exceeds the 20MB limit.");
  }
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
  catch { invalid("Text files must use valid UTF-8 encoding."); }
  limits.validateText(text);
  if (!text.trim()) invalid("Text file is empty.");
  for (const character of text) {
    const code = character.codePointAt(0);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
      invalid("Text file contains binary control characters.");
    }
  }
  return text;
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function validatePng(buffer) {
  let offset = 8;
  let imageData = false;
  let ended = false;
  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) invalid("Truncated PNG chunk.");
    const size = buffer.readUInt32BE(offset);
    const end = offset + 12 + size;
    if (end > buffer.length) invalid("Truncated PNG chunk.");
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (offset === 8 && (type !== "IHDR" || size !== 13)) invalid("Invalid PNG header.");
    if (crc32(buffer.subarray(offset + 4, end - 4)) !== buffer.readUInt32BE(end - 4)) invalid("PNG checksum mismatch.");
    if (type === "IDAT") imageData = true;
    if (type === "IEND") {
      if (size !== 0 || end !== buffer.length) invalid("Invalid PNG end marker.");
      ended = true;
    }
    offset = end;
  }
  if (!ended || !imageData) invalid("Incomplete PNG file.");
}

function validateJpeg(buffer) {
  let offset = 2;
  let scanned = false;
  while (offset < buffer.length) {
    if (buffer[offset++] !== 255) invalid("Invalid JPEG marker.");
    while (buffer[offset] === 255) offset++;
    const marker = buffer[offset++];
    if (marker === 217) {
      if (!scanned) invalid("Missing JPEG image data.");
      return;
    }
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
    if (offset + 2 > buffer.length) invalid("Truncated JPEG segment.");
    const size = buffer.readUInt16BE(offset);
    if (size < 2 || offset + size > buffer.length) invalid("Invalid JPEG segment.");
    offset += size;
    if (marker === 218) {
      scanned = true;
      while (offset < buffer.length) {
        if (buffer[offset] !== 255) { offset++; continue; }
        let next = offset + 1;
        while (buffer[next] === 255) next++;
        if (buffer[next] === 0 || (buffer[next] >= 208 && buffer[next] <= 215)) { offset = next + 1; continue; }
        break;
      }
    }
  }
  invalid("Truncated JPEG image data.");
}

async function validateDocumentContent(buffer, mimeType) {
  if (mimeType === "text/plain") return validateTextFile(buffer);
  limits.validateInput(buffer, mimeType);
  if (mimeType === "application/pdf") {
    if (!/^%PDF-\d\.\d/.test(buffer.toString("ascii", 0, 8)) || !/%%EOF\s*$/.test(buffer.subarray(-1024).toString("latin1"))) {
      invalid("Incomplete PDF file.");
    }
    const { PDFParse } = require("pdf-parse");
    const parser = new PDFParse({ data: buffer, stopAtErrors: true, isEvalSupported: false, useSystemFonts: false });
    try {
      const summary = await parser.getInfo();
      try { limits.validatePages(summary.total); }
      catch (error) { error.validationCode = "limits"; throw error; }
      const info = await parser.getInfo({ parsePageInfo: true });
      for (const page of info.pages) {
        if (!Number.isFinite(page.width) || !Number.isFinite(page.height) || page.width <= 0 || page.height <= 0 ||
            page.width > 12000 || page.height > 12000 || page.width * page.height > 20000000) {
          invalid("PDF page dimensions exceed supported limits.", "limits");
        }
        await parser.getScreenshot({ partial: [page.pageNumber], scale: Math.min(1, 512 / Math.max(page.width, page.height)), imageDataUrl: false, imageBuffer: false });
      }
    } finally { await parser.destroy(); }
    return;
  }
  if (mimeType === "image/png") validatePng(buffer);
  else validateJpeg(buffer);
  // Use the decoder already shipped with pdf-parse; no new dependency is installed.
  const pdfRequire = createRequire(require.resolve("pdf-parse"));
  const { loadImage, createCanvas } = pdfRequire("@napi-rs/canvas");
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext("2d").drawImage(image, 0, 0);
  canvas.getContext("2d").getImageData(0, 0, 1, 1);
}

module.exports = { validateTextFile, validateDocumentContent };
