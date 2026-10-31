const test = require("node:test");
const assert = require("node:assert/strict");
const { segmentContractText } = require("../src/services/clauseSegmenter");

test("short obligations survive beside longer numbered clauses", () => {
  const texts = [
    "1. No overtime pay.",
    "2. The employee agrees to observe all workplace safety procedures.",
    "3. No paid leave.",
  ];
  const clauses = segmentContractText(texts.join("\n\n"));
  assert.deepEqual(clauses.map((clause) => clause.clauseText), texts);
  assert.deepEqual(clauses.map((clause) => clause.clauseIndex), [0, 1, 2]);
  assert.ok(clauses[0].allCategories.includes("working_hours_overtime"));
});

test("paragraph segmentation preserves short and non-English text without inventing boundaries", () => {
  const texts = ["Walang bayad na OT.", "休暇なし。", "Pay is due monthly."];
  const clauses = segmentContractText(`  ${texts.join("\r\n\r\n\r\n")}  `);
  assert.deepEqual(clauses.map((clause) => clause.clauseText), texts);
  assert.ok(clauses.every((clause) => clause.title && clause.clauseText));
});

test("section boundaries preserve headings and short terms in order", () => {
  const texts = ["EMPLOYMENT", "Section 1\nNo overtime pay.", "Article II\nNo paid leave."];
  const clauses = segmentContractText(texts.join("\n"));
  assert.deepEqual(clauses.map((clause) => clause.clauseText), texts);
  assert.deepEqual(clauses.map((clause) => clause.clauseIndex), [0, 1, 2]);
});

test("single short input remains available for review and empty input produces no clauses", () => {
  assert.equal(segmentContractText(" No pay. ")[0].clauseText, "No pay.");
  for (const input of ["", " \r\n\t ", null, undefined, 42, {}]) {
    assert.deepEqual(segmentContractText(input), []);
  }
});
