const asyncHandler = require("express-async-handler");
const Contract = require("../models/Contract");
const ContractFlag = require("../models/ContractFlag");

const access = require("../services/contractAccess");
const REVIEWED = ["approved", "overridden", "dismissed"];
const RISKS = ["low", "medium", "high"];

// Both flag edits and completion write the parent contract in the same transaction.
// This serializes decisions against finalization instead of relying on a stale read.
async function reviewTransaction(contractId, user, operation, statuses = ["under_review"]) {
  const session = await Contract.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const contract = await Contract.findOneAndUpdate({ _id: contractId, assignedAttorneyId: user._id,
        status: { $in: statuses }, reportReleasedToClient: { $ne: true } }, { $inc: { __v: 1 } }, { new: true, session });
      if (!contract) {
        const existing = await Contract.findById(contractId).session(session);
        if (!existing) access.deny("Contract not found.", 404);
        if (!access.isAssigned(user, existing)) access.deny("Access denied.");
        access.deny("Only an active, unreleased review may be modified.", 409);
      }
      result = await operation(contract, session);
    });
    return result;
  } finally { await session.endSession(); }
}

/** Own assigned contracts plus a minimal queue of ready, unassigned work. */
const getReviewQueue = asyncHandler(async (req, res) => {
  const { assigned, status } = req.query;
  const query = { $or: [{ assignedAttorneyId: req.user._id },
    { assignedAttorneyId: null, status: "awaiting_attorney_review", reportReleasedToClient: { $ne: true } }] };
  if (assigned !== undefined && !["me", "unassigned", "all"].includes(assigned)) access.deny("Invalid assignment filter.", 400);
  if (assigned === "me") query.assignedAttorneyId = req.user._id;
  if (assigned === "unassigned") query.assignedAttorneyId = null;
  if (status && status !== "all") {
    if (!["awaiting_review", "awaiting_attorney_review", "under_review", "completed"].includes(status)) access.deny("Invalid review status.", 400);
    query.status = status === "awaiting_review" ? { $in: ["awaiting_attorney_review", "under_review"] } : status;
  }
  const contracts = await Contract.find(query).sort({ createdAt: -1 }).select("-rawOcrText");
  res.status(200).json({ count: contracts.length, contracts: contracts.map((contract) => access.queueView(req.user, contract)) });
});

/** Atomically claim ready work. Reading a resource never assigns it. */
const assignContract = asyncHandler(async (req, res) => {
  let contract = await Contract.findOneAndUpdate({ _id: req.params.id, assignedAttorneyId: null,
    status: "awaiting_attorney_review", reportReleasedToClient: { $ne: true } }, {
      $set: { assignedAttorneyId: req.user._id, status: "under_review" }, $inc: { __v: 1 },
    }, { new: true });
  if (!contract) {
    contract = await Contract.findById(req.params.id);
    if (!contract) access.deny("Contract not found.", 404);
    if (contract.assignedAttorneyId && !access.isAssigned(req.user, contract)) access.deny("Access denied.");
    if (access.isAssigned(req.user, contract) && ["under_review", "completed"].includes(contract.status)) {
      res.status(200).json({ message: "Contract already assigned to you.", contract: access.attorneyView(contract) });
      return;
    }
    access.deny("Contract is not ready to be claimed.", 409);
  }
  const { logAction } = require("../services/auditService");
  await logAction({ req, action: "CONTRACT_ASSIGNED", entityType: "contract", entityId: contract._id,
    entityLabel: contract.requestNumber || contract.title, details: { assignedAttorney: req.user.fullName } }).catch(() => {});
  const { createNotification } = require("../services/notificationService");
  await createNotification({ recipient: contract.clientId, contract: contract._id, type: "attorney-reviewing",
    title: "Attorney Review Commenced", message: `Your contract "${contract.title}" is now being reviewed by your assigned attorney.`,
    link: `/client/track-status/${contract._id}` }).catch(() => {});
  res.status(200).json({ message: "Contract assigned successfully.", contract: access.attorneyView(contract) });
});

const getContractFlags = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) access.deny("Contract not found.", 404);
  if (!access.isAssigned(req.user, contract)) access.deny("Claim this contract before accessing its findings.");
  const flags = await ContractFlag.find({ contractId: req.params.id }).sort({ clauseIndex: 1 })
    .populate("statutoryBases.sourceId", "title citation sourceType").populate("reviewedBy", "fullName email");
  res.status(200).json({ count: flags.length, flags });
});

const updateFlag = asyncHandler(async (req, res) => {
  const body = req.body;
  const keys = ["attorneyStatus", "attorneyRiskOverride", "attorneyNote", "includedInReport"];
  if (!body || Array.isArray(body) || Object.keys(body).some((key) => !keys.includes(key))) access.deny("Invalid clause update.", 400);
  if (body.attorneyStatus !== undefined && !["pending", ...REVIEWED].includes(body.attorneyStatus)) access.deny("Invalid attorneyStatus.", 400);
  if (body.attorneyRiskOverride !== undefined && body.attorneyRiskOverride !== null && !RISKS.includes(body.attorneyRiskOverride)) access.deny("Invalid attorneyRiskOverride.", 400);
  if (body.attorneyNote !== undefined && (typeof body.attorneyNote !== "string" || body.attorneyNote.length > 10000)) access.deny("Invalid attorney note.", 400);
  if (body.includedInReport !== undefined && typeof body.includedInReport !== "boolean") access.deny("includedInReport must be a boolean.", 400);
  const initial = await ContractFlag.findById(req.params.flagId);
  if (!initial) access.deny("Contract flag not found.", 404);
  const updated = await reviewTransaction(initial.contractId, req.user, async (_contract, session) => {
    const flag = await ContractFlag.findById(req.params.flagId).session(session);
    if (!flag || access.id(flag.contractId) !== access.id(initial.contractId)) access.deny("Contract flag not found.", 404);
    const status = body.attorneyStatus ?? flag.attorneyStatus;
    const risk = body.attorneyRiskOverride !== undefined ? body.attorneyRiskOverride : flag.attorneyRiskOverride;
    if (status === "overridden" && !RISKS.includes(risk)) access.deny("An overridden decision requires a risk level.", 400);
    if (status === "dismissed" && body.includedInReport === true) access.deny("Dismissed clauses cannot be included in the report.", 400);
    const fields = { attorneyStatus: status, attorneyRiskOverride: status === "overridden" ? risk : null,
      reviewedBy: req.user._id, reviewedAt: new Date() };
    if (body.attorneyNote !== undefined) fields.attorneyNote = body.attorneyNote.trim();
    if (body.includedInReport !== undefined) fields.includedInReport = body.includedInReport;
    if (status === "dismissed") fields.includedInReport = false;
    return ContractFlag.findOneAndUpdate({ _id: flag._id, contractId: initial.contractId }, { $set: fields }, { new: true, runValidators: true, session });
  });
  const { logAction } = require("../services/auditService");
  await logAction({ req, action: "FLAG_OVERRIDDEN", entityType: "clause_flag", entityId: updated._id,
    entityLabel: `Clause #${updated.clauseIndex + 1}`, details: { contractId: updated.contractId,
      attorneyStatus: updated.attorneyStatus, hasNote: Boolean(updated.attorneyNote) } }).catch(() => {});
  res.status(200).json({ message: "Flag updated successfully.", flag: updated });
});

const completeReview = asyncHandler(async (req, res) => {
  const body = req.body;
  if (!body || Array.isArray(body) || Object.keys(body).some((key) => !["attorneyNotes", "attorneyRiskOverride", "releaseReport"].includes(key))) access.deny("Invalid completion request.", 400);
  if (body.attorneyRiskOverride !== undefined && body.attorneyRiskOverride !== null && !RISKS.includes(body.attorneyRiskOverride)) access.deny("Invalid attorneyRiskOverride.", 400);
  if (body.attorneyNotes !== undefined && (typeof body.attorneyNotes !== "string" || body.attorneyNotes.length > 10000)) access.deny("Invalid attorney notes.", 400);
  if (body.releaseReport !== undefined && typeof body.releaseReport !== "boolean") access.deny("releaseReport must be a boolean.", 400);
  const contract = await reviewTransaction(req.params.id, req.user, async (current, session) => {
    const flags = await ContractFlag.find({ contractId: current._id }).session(session);
    if (!flags.length) access.deny("No clauses are available. Manual transcription and clause review are required before completion.", 409);
    if (flags.some((flag) => !REVIEWED.includes(flag.attorneyStatus) ||
      (flag.attorneyStatus === "overridden" && !RISKS.includes(flag.attorneyRiskOverride)))) {
      access.deny("Review every clause before completing this contract.", 409);
    }
    if (current.status === "completed") {
      if (body.releaseReport !== true || body.attorneyNotes !== undefined || body.attorneyRiskOverride !== undefined) {
        access.deny("A completed draft may only be released; its findings cannot be edited.", 409);
      }
      return Contract.findOneAndUpdate({ _id: current._id }, { $set: {
        reportReleasedToClient: true, reportReleasedAt: new Date(),
      } }, { new: true, session });
    }
    const released = body.releaseReport !== false;
    const fields = { status: "completed", reviewCompletedAt: new Date(),
      reportReleasedToClient: released, reportReleasedAt: released ? new Date() : null };
    if (body.attorneyNotes !== undefined) fields.attorneyNotes = body.attorneyNotes.trim();
    if (body.attorneyRiskOverride !== undefined) fields.attorneyRiskOverride = body.attorneyRiskOverride;
    return Contract.findOneAndUpdate({ _id: current._id }, { $set: fields }, { new: true, runValidators: true, session });
  }, ["under_review", "completed"]);
  const { logAction } = require("../services/auditService");
  await logAction({ req, action: "REVIEW_COMPLETED", entityType: "contract", entityId: contract._id,
    entityLabel: contract.requestNumber || contract.title, details: { reportReleasedToClient: contract.reportReleasedToClient } }).catch(() => {});
  if (contract.reportReleasedToClient) {
    const { createNotification } = require("../services/notificationService");
    await createNotification({ recipient: contract.clientId, contract: contract._id, type: "report-ready",
      title: "Verified Legal Report Ready", message: `Your finalized report for "${contract.title}" is now available.`,
      link: `/client/contract-report/${contract._id}` }).catch(() => {});
  }
  res.status(200).json({ message: "Contract review completed.", contract: access.attorneyView(contract) });
});

module.exports = { getReviewQueue, assignContract, getContractFlags, updateFlag, completeReview };
