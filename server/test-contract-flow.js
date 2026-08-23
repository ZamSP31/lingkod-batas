require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const Contract = require("./src/models/Contract");
const User = require("./src/models/User");
const { processContract } = require("./src/services/ocrService");

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

async function runDatabaseFlowTest() {
  console.log("==================================================");
  console.log("  TESTING FULL CONTRACT OCR LIFECYCLE IN MONGODB  ");
  console.log("==================================================");

  await connectDB();

  let testUser = await User.findOne({ email: "test-ocr@lingkodbatas.ph" });
  if (!testUser) {
    testUser = await User.create({
      fullName: "Test OCR Client",
      email: "test-ocr@lingkodbatas.ph",
      password: "Password123!",
      role: "client",
    });
  }

  // 1. Create a pending contract
  const contract = new Contract({
    clientId: testUser._id,
    title: "Test Digital Employment Contract",
    contractType: "employment",
    cloudinaryUrl: "https://res.cloudinary.com/dummy/raw/upload/test.pdf",
    cloudinaryPublicId: "test_ocr_contract_123",
    fileSize: 1024,
    fileName: "test_contract.pdf",
    fileType: "pdf",
    status: "pending",
  });
  await contract.save();
  console.log(
    `[DB] Created test contract ID: ${contract._id} | Status: ${contract.status} | RequestNumber: ${contract.requestNumber}`,
  );

  // 2. Trigger processContract with a digital PDF buffer
  const sampleText =
    "PHILIPPINES EMPLOYMENT AGREEMENT: The employee shall receive 13th month pay under PD 851.";
  const testBuffer = generateTestPdfBuffer(sampleText);

  console.log(`[OCR] Running processContract for ${contract._id}...`);
  await processContract(contract._id, testBuffer, "application/pdf");

  // 3. Re-fetch and verify the contract document in DB
  const updated = await Contract.findById(contract._id);
  console.log(`[DB] Updated contract:`);
  console.log(`   - Status: ${updated.status}`);
  console.log(`   - OCR Method: ${updated.ocrMethod}`);
  console.log(
    `   - Flagged for manual review: ${updated.flaggedForManualReview}`,
  );
  console.log(`   - Extracted text preview: ${updated.rawOcrText.trim()}`);

  const passed =
    updated.status === "ai_analysis" &&
    updated.ocrMethod === "direct" &&
    updated.flaggedForManualReview === false &&
    updated.rawOcrText.includes("PHILIPPINES EMPLOYMENT AGREEMENT");

  // Cleanup test documents
  await Contract.findByIdAndDelete(contract._id);
  await User.findByIdAndDelete(testUser._id);
  await mongoose.disconnect();

  if (passed) {
    console.log(
      "\n✅ [PASS] Full End-to-End Contract DB & OCR lifecycle test PASSED!",
    );
  } else {
    console.error("\n❌ [FAIL] Contract did not transition to expected state.");
    process.exit(1);
  }
}

runDatabaseFlowTest().catch((err) => {
  console.error("Database test error:", err);
  process.exit(1);
});
