const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { CONSENT_VERSION, recordConsent } = require("../src/utils/consent");
const { createHarness } = require("./helpers/isolatedHarness");

test("consent accepts only explicit agreement to the current notice and records server time", () => {
  for (const consentAccepted of [true, "true"]) {
    const before = Date.now();
    const record = recordConsent({ consentAccepted, consentVersion: CONSENT_VERSION, consentAcceptedAt: "1900-01-01" });
    assert.equal(record.consentVersion, CONSENT_VERSION);
    assert.ok(record.consentAcceptedAt.getTime() >= before && record.consentAcceptedAt.getTime() <= Date.now());
  }
  for (const consentAccepted of [false, "false", 1, "yes", {}, [], null, undefined]) {
    assert.throws(() => recordConsent({ consentAccepted, consentVersion: CONSENT_VERSION }), { statusCode: 400 });
  }
  assert.throws(() => recordConsent({ consentAccepted: true, consentVersion: "old" }), { statusCode: 400 });
  const frontend = fs.readFileSync(path.join(__dirname, "../../client/src/utils/consent.ts"), "utf8");
  assert.ok(frontend.includes(`"${CONSENT_VERSION}"`));
});

test("missing upload consent is rejected before storage or persistence", async () => {
  const h = createHarness();
  const controller = h.load("controllers/contractController.js", { "../utils/consent": { recordConsent } });
  const result = await h.invoke(controller.submitContract, { body: { title: "Synthetic", contractType: "regular" } });
  assert.equal(result.statusCode, 400); assert.equal(h.calls.length, 0);
});
