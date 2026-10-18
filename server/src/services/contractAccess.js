const id = (value) => String(value?._id ?? value ?? "");

function deny(message, statusCode = 403) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function isAssigned(user, contract) {
  return user.role === "attorney" && id(contract.assignedAttorneyId) === id(user._id);
}

function assertRead(user, contract) {
  if (!((user.role === "client" && id(contract.clientId) === id(user._id)) || isAssigned(user, contract))) {
    deny("Access denied.");
  }
}

const BASIC_FIELDS = ["_id", "id", "requestNumber", "title", "contractType", "status",
  "fileName", "fileType", "fileSize", "createdAt", "updatedAt", "piiSanitized", "piiRedactionCount",
  "reportReleasedToClient"];

function pick(contract, fields) {
  const doc = contract.toObject ? contract.toObject() : contract;
  return Object.fromEntries(fields.filter((key) => doc[key] !== undefined).map((key) => [key, doc[key]]));
}

function clientView(contract) {
  const fields = [...BASIC_FIELDS, "assignedAttorneyId"];
  if (contract.status === "completed" && contract.reportReleasedToClient === true) {
    fields.push("assessmentState", "insufficientEvidenceCount", "aiRiskLevel", "attorneyRiskOverride", "finalRiskLevel", "attorneyNotes", "reviewCompletedAt", "reportReleasedAt");
  }
  return pick(contract, fields);
}

function queueView(user, contract) {
  return pick(contract, isAssigned(user, contract)
    ? [...BASIC_FIELDS, "assignedAttorneyId", "aiRiskLevel"] : BASIC_FIELDS);
}

function attorneyView(contract) {
  const doc = contract.toObject ? contract.toObject() : { ...contract };
  for (const key of ["cloudinaryUrl", "cloudinaryPublicId", "reportCloudinaryUrl", "processingToken",
    "processingLeaseUntil", "processingAttempts", "processingNextAttemptAt"]) delete doc[key];
  return doc;
}

module.exports = { id, deny, isAssigned, assertRead, clientView, queueView, attorneyView };
