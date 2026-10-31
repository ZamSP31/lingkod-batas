const test = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, fixture } = require("./helpers/isolatedHarness");
const service = require("../src/services/manualTranscription");
const attorney = { _id: "attorney-a", role: "attorney" };
function setup(overrides = {}) {
  const h = createHarness({ contracts: [fixture({ contractType: "regular", flaggedForManualReview: true, ...overrides })] });
  const controller = h.load("controllers/attorneyController.js", { "../services/manualTranscription": service });
  return { h, controller, save: (body = { text: "1. No overtime pay.\n2. Salary is paid monthly." }, user = attorney) =>
    h.invoke(controller.saveTranscription, { body, user }) };
}

test("assigned attorney can recover zero-clause review but must manually decide every clause", async () => {
  const { h, controller, save } = setup();
  assert.equal((await save()).statusCode, 201);
  assert.equal(h.flags.length, 2);
  assert.equal(h.flags[0].clauseText, "1. No overtime pay.");
  assert.ok(h.flags.every(flag => flag.assessmentState === "insufficient_evidence" && flag.attorneyStatus === "pending" && !flag.statutoryBases.length));
  assert.equal(h.contracts[0].aiRiskLevel, null);
  assert.equal(h.contracts[0].ocrMethod, "manual");
  assert.equal((await h.invoke(controller.completeReview, { user: attorney })).statusCode, 409);
  for (const flag of h.flags) {
    assert.equal((await h.invoke(controller.updateFlag, { user: attorney, params: { flagId: flag._id }, body: {
      attorneyStatus: "overridden", attorneyRiskOverride: "medium", attorneyNote: "Synthetic independent review against the original document.",
    } })).statusCode, 200);
  }
  assert.equal((await h.invoke(controller.completeReview, { user: attorney })).statusCode, 200);
});

test("transcription is denied to other users and finalized or processing contracts", async () => {
  for (const user of [{ _id: "attorney-b", role: "attorney" }, { _id: "client-a", role: "client" }]) {
    const { h, save } = setup(); assert.equal((await save({ text: "Synthetic clause" }, user)).statusCode, 403); assert.equal(h.flags.length, 0);
  }
  for (const status of ["pending", "ocr_processing", "ai_analysis", "awaiting_attorney_review", "completed"]) {
    const { h, save } = setup({ status }); assert.equal((await save()).statusCode, 409); assert.equal(h.flags.length, 0);
  }
});

test("invalid transcription cannot write flags and simultaneous saves have one winner", async () => {
  for (const body of [{}, { text: " " }, { text: [] }, { text: "x".repeat(250001) }, { text: "Valid", attorneyStatus: "approved" }]) {
    const { h, save } = setup(); assert.ok((await save(body)).error); assert.equal(h.flags.length, 0);
  }
  const { h, save } = setup();
  const results = await Promise.all([save(), save()]);
  assert.deepEqual(results.map(result => result.statusCode).sort(), [201, 409]);
  assert.equal(h.flags.length, 2);
  assert.equal(h.calls.filter(call => call.name === "audit").length, 1);
});

test("manual preparation enforces clause limit and masks recognized identifiers", () => {
  assert.throws(() => service.prepareTranscription(Array.from({ length: 501 }, (_, index) => `${index + 1}. No pay.`).join("\n"), fixture()), /at most 500/);
  const prepared = service.prepareTranscription("Email owner@example.invalid for payroll.", fixture({ contractType: "regular" }));
  assert.ok(!prepared.flags[0].clauseText.includes("owner@example.invalid"));
  assert.equal(prepared.fields.piiRedactionCount, 1);
});
