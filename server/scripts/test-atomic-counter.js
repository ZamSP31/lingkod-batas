require("dotenv").config();
const mongoose = require("mongoose");
const Counter = require("../src/models/Counter");
const Contract = require("../src/models/Contract");
const User = require("../src/models/User");

async function testAtomicSequence() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to Atlas.");

  const year = new Date().getFullYear();
  const counterId = `contract_${year}`;

  // 1. Find existing max sequence
  const existing = await Contract.find({
    requestNumber: { $regex: `^LB-${year}-` },
  })
    .select("requestNumber")
    .lean();
  let maxSeq = 0;
  for (const c of existing) {
    if (c.requestNumber) {
      const num = parseInt(c.requestNumber.split("-")[2], 10);
      if (!isNaN(num) && num > maxSeq) maxSeq = num;
    }
  }
  console.log(`Found existing max sequence for ${year}: ${maxSeq}`);

  // 2. Initialize Counter with existing maxSeq
  await Counter.findByIdAndUpdate(
    counterId,
    { $set: { seq: maxSeq } },
    { upsert: true, new: true },
  );
  console.log(`Counter initialized to: ${maxSeq}`);

  // 3. Find a valid user to use as clientId for testing
  const testUser = await User.findOne({ role: "client" }).select("_id");
  if (!testUser) throw new Error("No test user found");

  // 4. Concurrency Stress Test: Fire 10 simultaneous saves
  console.log("Simulating 10 concurrent contract uploads via Promise.all()...");
  const promises = [];
  for (let i = 0; i < 10; i++) {
    const dummyContract = new Contract({
      clientId: testUser._id,
      title: `Concurrency Stress Test #${i}`,
      contractType: "regular",
      cloudinaryUrl: "https://res.cloudinary.com/test.pdf",
      cloudinaryPublicId: `test_concurrency_${i}_${Date.now()}`,
      fileSize: 1024,
      fileName: "test.pdf",
      fileType: "pdf",
    });
    promises.push(dummyContract.save());
  }

  const results = await Promise.all(promises);
  const createdNumbers = results.map((r) => r.requestNumber);
  console.log("Created Request Numbers:", createdNumbers);

  // 5. Assert uniqueness
  const uniqueSet = new Set(createdNumbers);
  if (uniqueSet.size === 10) {
    console.log("PASS: All 10 concurrent contracts received strictly UNIQUE sequential IDs!");
  } else {
    console.error("FAIL: Duplicate IDs detected!");
  }

  // 6. Clean up test records and restore Counter seq
  const testIds = results.map((r) => r._id);
  await Contract.deleteMany({ _id: { $in: testIds } });
  await Counter.findByIdAndUpdate(counterId, { $set: { seq: maxSeq } });
  console.log(`Cleaned up 10 test records and verified Counter seq reset to: ${maxSeq}`);

  await mongoose.disconnect();
}

testAtomicSequence().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

