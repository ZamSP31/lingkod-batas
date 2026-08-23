const {
  processDocument,
  processImage,
  hasUsableTextLayer,
  CONFIDENCE_THRESHOLD,
} = require("./src/services/ocrService");

// Generates a valid minimal digital PDF buffer containing text
function generateTestPdfBuffer(text) {
  const streamContent = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
  const streamLen = Buffer.byteLength(streamContent);

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLen} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
370
%%EOF`;

  return Buffer.from(pdf);
}

async function runTests() {
  console.log("==================================================");
  console.log("  LINGKOD BATAS — OCR PIPELINE VERIFICATION SUITE ");
  console.log("==================================================");

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // --- Test 1: Usable text layer heuristic ---
  console.log("\n[Group 1: Usable Text Layer Heuristic]");
  const sampleContractText =
    "EMPLOYMENT AGREEMENT: This contract is entered into by Employer and Employee under the Philippine Labor Code.";
  const emptyOrNoise = "%$^&*! 123";
  assert(
    hasUsableTextLayer(sampleContractText) === true,
    "Valid contract text satisfies minimum length & alphanumeric density",
  );
  assert(
    hasUsableTextLayer(emptyOrNoise) === false,
    "Garbage/symbol noise fails alphanumeric density check",
  );
  assert(
    hasUsableTextLayer("") === false,
    "Empty string fails usable text check",
  );

  // --- Test 2: Digital PDF Processing ---
  console.log("\n[Group 2: Digital PDF Direct Text Extraction]");
  const digitalPdf = generateTestPdfBuffer(
    "EMPLOYMENT CONTRACT - Section 1: Terms of Employment under Philippine Labor Law",
  );
  const pdfResult = await processDocument(digitalPdf);
  console.log("   Output from processDocument:", JSON.stringify(pdfResult));
  assert(
    pdfResult.method === "direct",
    "Direct text extraction method chosen for digital PDF",
  );
  assert(
    pdfResult.confidence === null,
    "Direct text extraction has confidence=null (exact text layer)",
  );
  assert(
    pdfResult.flaggedForReview === false,
    "Direct text is not flagged for manual review",
  );
  assert(
    pdfResult.text.includes("EMPLOYMENT CONTRACT"),
    "Extracted text contains original contract string",
  );

  // --- Test 3: Low-Confidence / Blank Image Handling ---
  console.log("\n[Group 3: Image OCR & Low Confidence Flagging]");
  const blankPngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const blankPngBuffer = Buffer.from(blankPngBase64, "base64");
  const imgResult = await processImage(blankPngBuffer);
  console.log(
    "   Output from processImage (blank):",
    JSON.stringify(imgResult),
  );
  assert(
    imgResult.flaggedForReview === true,
    "Blank/unclear image is correctly flagged for manual attorney review",
  );
  assert(
    typeof imgResult.confidence === "number",
    "Image OCR outputs numeric confidence score",
  );
  assert(
    imgResult.confidence < CONFIDENCE_THRESHOLD,
    `Confidence (${imgResult.confidence}) is below threshold (${CONFIDENCE_THRESHOLD})`,
  );

  console.log("\n==================================================");
  console.log(
    `  VERIFICATION RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`,
  );
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution encountered an error:", err);
  process.exit(1);
});
