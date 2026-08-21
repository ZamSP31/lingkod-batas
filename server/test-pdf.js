const fs = require("fs");
const { PDFParse } = require("pdf-parse");

// --- THE DECISION FUNCTION (Checks if extracted text is real or garbage) ---
function hasUsableTextLayer(extractedText) {
  if (!extractedText || typeof extractedText !== "string") {
    return false;
  }

  const trimmedText = extractedText.trim();

  // A real multi-page contract will have substantial text length
  if (trimmedText.length < 50) {
    return false;
  }

  // Check ratio of alphanumeric characters to ensure it's not pure symbol noise
  const alphanumericMatches = trimmedText.match(/[a-zA-Z0-9]/g);
  const alphanumericCount = alphanumericMatches
    ? alphanumericMatches.length
    : 0;
  const ratio = alphanumericCount / trimmedText.length;

  if (ratio < 0.3) {
    return false;
  }

  return true; // Passed checks: It's a digital-native PDF with usable text!
}

// --- DIRECT TEXT EXTRACTION GATE ---
async function testPdfExtraction(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });

  try {
    console.log(`\n--- Testing file: ${filePath} ---`);

    // Extract raw text using the updated v2 API
    const result = await parser.getText();
    const rawText = result.text;

    // Evaluate if the text layer is usable
    const isUsable = hasUsableTextLayer(rawText);

    console.log(`Page count: ${result.total}`);
    console.log(`Extracted text length: ${rawText.trim().length} characters`);
    console.log(
      `Has usable text layer? 👉 ${isUsable ? "YES (Skip OCR)" : "NO (Trigger Tesseract OCR)"}`,
    );
    console.log(`--- Preview (first 150 chars) ---`);
    console.log(rawText.slice(0, 150));
    console.log(`----------------------------------------`);

    return isUsable;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return false;
  } finally {
    await parser.destroy();
  }
}

async function run() {
  const digitalPdfPath = "./sample-digital.pdf";
  const scannedPdfPath = "./sample-scanned.pdf";

  if (fs.existsSync(digitalPdfPath)) {
    await testPdfExtraction(digitalPdfPath);
  } else {
    console.log(
      `⚠️ Place a digital-native PDF at ${digitalPdfPath} to test it.`,
    );
  }

  if (fs.existsSync(scannedPdfPath)) {
    await testPdfExtraction(scannedPdfPath);
  } else {
    console.log(`⚠️ Place a scanned PDF at ${scannedPdfPath} to test it.`);
  }
}

run();
