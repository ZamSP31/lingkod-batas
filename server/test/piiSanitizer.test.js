const test = require("node:test");
const assert = require("node:assert/strict");
const { maskPII } = require("../src/utils/piiSanitizer");

test("recognized landlines and mobile numbers are masked with accurate counts", () => {
  const result = maskPII("Phones: (02) 8123-4567; 02-8123-4567; +63 2 8123 4567; 09171234567");
  assert.equal(result.redactionCounts.phone, 4);
  assert.equal(result.totalRedacted, 4);
  assert.equal((result.sanitizedText.match(/\[REDACTED_PHONE\]/g) || []).length, 4);
  assert.ok(!result.sanitizedText.includes("8123"));
});

test("landline masking preserves legal references, dates and bare monetary amounts", () => {
  const text = "Salary PHP 28123456. Article 113. Date 2026-10-31. Hours 08:00-17:00.";
  const result = maskPII(text);
  assert.equal(result.sanitizedText, text);
  assert.equal(result.totalRedacted, 0);
});

test("masking remains explicit about unmatched text instead of treating it as anonymized", () => {
  const text = "Employer: Example Manufacturing LLC";
  const result = maskPII(text);
  assert.equal(result.sanitizedText, text);
  assert.equal(result.hasRedactions, false);
});

test("party masking requires a label so employee obligations are not erased as names", () => {
  const clause = "Employee shall work eight hours per day. Worker must receive overtime pay.";
  assert.equal(maskPII(clause).sanitizedText, clause);
  const declaration = maskPII("Employee: Synthetic Person\nEmployee shall work eight hours per day.");
  assert.ok(declaration.sanitizedText.includes("Employee: [REDACTED_NAME]"));
  assert.ok(declaration.sanitizedText.includes("Employee shall work eight hours per day."));
});
