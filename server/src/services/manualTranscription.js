const { validateText } = require("../utils/documentLimits");
const { maskPII } = require("../utils/piiSanitizer");
const { segmentContractText } = require("./clauseSegmenter");

const MAX_MANUAL_CLAUSES = 500;

function prepareTranscription(text, contract) {
  if (typeof text !== "string" || !text.trim()) {
    const error = new Error("Enter the contract transcription before saving.");
    error.statusCode = 400;
    throw error;
  }
  validateText(text);
  const masked = maskPII(text.trim());
  const clauses = segmentContractText(masked.sanitizedText);
  if (clauses.length > MAX_MANUAL_CLAUSES) {
    const error = new Error(`A transcription may contain at most ${MAX_MANUAL_CLAUSES} clauses.`);
    error.statusCode = 422;
    throw error;
  }
  const flags = clauses.map(clause => ({
    contractId: contract._id, clauseIndex: clause.clauseIndex, clauseText: clause.clauseText,
    clientSelectedContractType: contract.contractType || "unknown",
    screeningScope: "general_employment", assessmentState: "insufficient_evidence", evidenceReason: "unsupported_rule",
    aiRiskLevel: "low", aiRationale: "Manually transcribed text: no automated assessment was performed. An attorney risk decision or dismissal with a rationale is required.",
    statutoryBases: [], riskCategories: clause.allCategories, attorneyStatus: "pending", includedInReport: true,
  }));
  return { flags, fields: { rawOcrText: masked.sanitizedText, ocrMethod: "manual", ocrConfidence: null,
    piiSanitized: true, piiRedactionCount: masked.totalRedacted, flaggedForManualReview: true,
    aiRiskLevel: null, assessmentState: "insufficient_evidence", insufficientEvidenceCount: flags.length } };
}

module.exports = { prepareTranscription };
