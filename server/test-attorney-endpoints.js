require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const connectDB = require("./src/config/db");
const app = require("./src/app");
const User = require("./src/models/User");
const Contract = require("./src/models/Contract");
const ContractFlag = require("./src/models/ContractFlag");

async function runAttorneyEndpointTests() {
  console.log("==================================================");
  console.log("   LINGKOD BATAS — ATTORNEY ENDPOINTS TEST SUITE  ");
  console.log("==================================================");

  await connectDB();

  // Start ephemeral server
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

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

  try {
    // 1. Create or retrieve test Attorney & Client users
    let attorney = await User.findOne({ email: "atty.test@lingkodbatas.ph" });
    if (!attorney) {
      attorney = await User.create({
        fullName: "Atty. Juan Luna",
        email: "atty.test@lingkodbatas.ph",
        password: "Password123!",
        role: "attorney",
        rollNumber: "12345",
      });
    }

    let client = await User.findOne({ email: "client.test@lingkodbatas.ph" });
    if (!client) {
      client = await User.create({
        fullName: "Maria Clara",
        email: "client.test@lingkodbatas.ph",
        password: "Password123!",
        role: "client",
      });
    }

    // Generate JWT tokens
    const attorneyToken = jwt.sign(
      { id: attorney._id, role: attorney.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    const clientToken = jwt.sign(
      { id: client._id, role: client.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // 2. Create a test Contract in 'awaiting_attorney_review'
    const testContract = await Contract.create({
      clientId: client._id,
      title: "Senior Developer Employment Agreement",
      contractType: "employment",
      cloudinaryUrl: "https://res.cloudinary.com/dummy/raw/upload/test.pdf",
      cloudinaryPublicId: "dummy_public_id_atty_test",
      fileSize: 2048,
      fileName: "dev_contract.pdf",
      fileType: "pdf",
      status: "awaiting_attorney_review",
      aiRiskLevel: "high",
    });

    // 3. Create sample ContractFlag
    const testFlag = await ContractFlag.create({
      contractId: testContract._id,
      clauseIndex: 1,
      clauseText:
        "Employee shall not work for any competitor worldwide for 5 years post-termination.",
      aiRiskLevel: "high",
      aiRationale:
        "Excessive duration and geographic scope of non-compete clause under Philippine jurisprudence.",
      riskCategories: ["non_compete"],
      attorneyStatus: "pending",
      includedInReport: true,
    });

    // --- TEST 1: Role-based Authorization Guard ---
    console.log("\n[Test Group 1: Role-Based Access Control]");
    const clientAttempt = await fetch(`${baseUrl}/api/attorney/queue`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    assert(
      clientAttempt.status === 403,
      "Client receives 403 Forbidden when accessing /api/attorney/queue",
    );

    const noAuthAttempt = await fetch(`${baseUrl}/api/attorney/queue`);
    assert(
      noAuthAttempt.status === 401,
      "Unauthenticated request receives 401 Unauthorized",
    );

    // --- TEST 2: GET /api/attorney/queue ---
    console.log("\n[Test Group 2: Review Queue Endpoint]");
    const queueRes = await fetch(`${baseUrl}/api/attorney/queue`, {
      headers: { Authorization: `Bearer ${attorneyToken}` },
    });
    const queueData = await queueRes.json();
    assert(
      queueRes.status === 200,
      "Attorney successfully fetches review queue (200 OK)",
    );
    assert(
      Array.isArray(queueData.contracts),
      "Queue response contains contracts array",
    );
    const foundInQueue = queueData.contracts.some(
      (c) => c._id.toString() === testContract._id.toString(),
    );
    assert(foundInQueue, "Test contract appears in attorney review queue");

    // --- TEST 3: PATCH /api/attorney/contracts/:id/assign ---
    console.log("\n[Test Group 3: Contract Self-Assignment]");
    const assignRes = await fetch(
      `${baseUrl}/api/attorney/contracts/${testContract._id}/assign`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${attorneyToken}` },
      },
    );
    const assignData = await assignRes.json();
    assert(
      assignRes.status === 200,
      "Attorney assigns contract successfully (200 OK)",
    );
    assert(
      assignData.contract.status === "under_review",
      "Contract status transitioned to 'under_review'",
    );
    assert(
      assignData.contract.assignedAttorneyId._id.toString() ===
        attorney._id.toString(),
      "assignedAttorneyId correctly matches attorney user ID",
    );

    // --- TEST 4: GET /api/attorney/contracts/:id/flags ---
    console.log("\n[Test Group 4: Fetch Contract Flags]");
    const flagsRes = await fetch(
      `${baseUrl}/api/attorney/contracts/${testContract._id}/flags`,
      {
        headers: { Authorization: `Bearer ${attorneyToken}` },
      },
    );
    const flagsData = await flagsRes.json();
    assert(flagsRes.status === 200, "Flags fetched successfully (200 OK)");
    assert(flagsData.count >= 1, "Returned flags count matches test flags");
    assert(
      flagsData.flags[0].clauseText.includes("worldwide for 5 years"),
      "Flag clause text returned accurately",
    );

    // --- TEST 5: PATCH /api/attorney/flags/:flagId (Override / Review) ---
    console.log("\n[Test Group 5: Flag Override / Update]");
    const updateFlagRes = await fetch(
      `${baseUrl}/api/attorney/flags/${testFlag._id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${attorneyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attorneyStatus: "overridden",
          attorneyRiskOverride: "medium",
          attorneyNote:
            "Reduce non-compete to 1 year within Metro Manila only.",
          includedInReport: true,
        }),
      },
    );
    const updateFlagData = await updateFlagRes.json();
    assert(updateFlagRes.status === 200, "Flag updated successfully (200 OK)");
    assert(
      updateFlagData.flag.attorneyStatus === "overridden",
      "attorneyStatus updated to 'overridden'",
    );
    assert(
      updateFlagData.flag.attorneyRiskOverride === "medium",
      "attorneyRiskOverride updated to 'medium'",
    );
    assert(
      updateFlagData.flag.attorneyNote.includes("Metro Manila"),
      "attorneyNote saved properly",
    );
    assert(
      updateFlagData.flag.reviewedBy._id.toString() === attorney._id.toString(),
      "reviewedBy recorded correctly",
    );

    // --- TEST 6: PATCH /api/attorney/contracts/:id/complete (Finalize Review) ---
    console.log("\n[Test Group 6: Complete Review & Release]");
    const completeRes = await fetch(
      `${baseUrl}/api/attorney/contracts/${testContract._id}/complete`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${attorneyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attorneyNotes:
            "Review completed. Flagged clauses require amendment before signing.",
          attorneyRiskOverride: "medium",
          releaseReport: true,
        }),
      },
    );
    const completeData = await completeRes.json();
    assert(
      completeRes.status === 200,
      "Contract review completed successfully (200 OK)",
    );
    assert(
      completeData.contract.status === "completed",
      "Contract status is 'completed'",
    );
    assert(
      completeData.contract.reportReleasedToClient === true,
      "reportReleasedToClient is true",
    );
    assert(
      Boolean(completeData.contract.reviewCompletedAt),
      "reviewCompletedAt timestamp set",
    );

    // --- Cleanup test entities ---
    await ContractFlag.deleteMany({ contractId: testContract._id });
    await Contract.findByIdAndDelete(testContract._id);
    await User.findByIdAndDelete(attorney._id);
    await User.findByIdAndDelete(client._id);

    console.log("\n==================================================");
    console.log(
      `  ATTORNEY SUITE RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`,
    );
    console.log("==================================================");

    if (passed !== total) {
      process.exit(1);
    }
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runAttorneyEndpointTests().catch((err) => {
  console.error("Attorney test execution encountered an error:", err);
  process.exit(1);
});
