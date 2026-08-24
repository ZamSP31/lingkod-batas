const asyncHandler = require("express-async-handler");
const Contract = require("../models/Contract");
const ContractFlag = require("../models/ContractFlag");

/**
 * GET /api/attorney/queue
 * Retrieves all contracts awaiting attorney review or currently under review.
 * Optional query params:
 *   - ?assigned=me (only contracts assigned to the requesting attorney)
 *   - ?assigned=unassigned (only contracts not yet assigned)
 *   - ?status=awaiting_attorney_review | under_review
 */
const getReviewQueue = asyncHandler(async (req, res) => {
  const { assigned, status } = req.query;

  const query = {};

  if (status && status !== "all") {
    if (status === "awaiting_review") {
      query.status = { $in: ["awaiting_attorney_review", "under_review"] };
    } else {
      query.status = status;
    }
  }

  if (assigned === "me") {
    query.assignedAttorneyId = req.user._id;
  } else if (assigned === "unassigned") {
    query.assignedAttorneyId = null;
  }

  const contracts = await Contract.find(query)
    .sort({ createdAt: -1 })
    .select("-rawOcrText")
    .populate("clientId", "fullName email")
    .populate("assignedAttorneyId", "fullName email");

  res.status(200).json({
    count: contracts.length,
    contracts,
  });
});

/**
 * PATCH /api/attorney/contracts/:id/assign
 * Attorney assigns a contract to themselves and marks it 'under_review'.
 */
const assignContract = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    res.status(404);
    throw new Error("Contract not found.");
  }

  contract.assignedAttorneyId = req.user._id;

  if (
    [
      "pending",
      "ocr_processing",
      "ai_analysis",
      "awaiting_attorney_review",
    ].includes(contract.status)
  ) {
    contract.status = "under_review";
  }

  await contract.save();

  const populated = await Contract.findById(contract._id)
    .populate("clientId", "fullName email")
    .populate("assignedAttorneyId", "fullName email");

  res.status(200).json({
    message: "Contract assigned successfully.",
    contract: populated,
  });
});

/**
 * GET /api/attorney/contracts/:id/flags
 * Retrieves all AI-detected flags for a contract, sorted by clause index.
 */
const getContractFlags = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    res.status(404);
    throw new Error("Contract not found.");
  }

  const flags = await ContractFlag.find({ contractId: req.params.id })
    .sort({ clauseIndex: 1 })
    .populate("statutoryBases.sourceId", "title citation sourceType")
    .populate("reviewedBy", "fullName email");

  res.status(200).json({
    count: flags.length,
    flags,
  });
});

/**
 * PATCH /api/attorney/flags/:flagId
 * Attorney approves, overrides, or dismisses an AI-generated risk flag.
 */
const updateFlag = asyncHandler(async (req, res) => {
  const flag = await ContractFlag.findById(req.params.flagId);

  if (!flag) {
    res.status(404);
    throw new Error("Contract flag not found.");
  }

  const validStatuses = ["pending", "approved", "overridden", "dismissed"];
  if (
    req.body.attorneyStatus &&
    !validStatuses.includes(req.body.attorneyStatus)
  ) {
    res.status(400);
    throw new Error(
      "attorneyStatus must be: pending, approved, overridden, or dismissed.",
    );
  }

  const validOverrides = ["low", "medium", "high", null];
  if (
    req.body.attorneyRiskOverride !== undefined &&
    !validOverrides.includes(req.body.attorneyRiskOverride)
  ) {
    res.status(400);
    throw new Error(
      "attorneyRiskOverride must be: low, medium, high, or null.",
    );
  }

  if (req.body.attorneyStatus !== undefined) {
    flag.attorneyStatus = req.body.attorneyStatus;
  }

  if (req.body.attorneyRiskOverride !== undefined) {
    flag.attorneyRiskOverride = req.body.attorneyRiskOverride;
  }

  if (req.body.attorneyNote !== undefined) {
    flag.attorneyNote = req.body.attorneyNote.trim();
  }

  if (req.body.includedInReport !== undefined) {
    flag.includedInReport = Boolean(req.body.includedInReport);
  }

  flag.reviewedBy = req.user._id;
  flag.reviewedAt = new Date();

  await flag.save();

  const populated = await ContractFlag.findById(flag._id)
    .populate("statutoryBases.sourceId", "title citation sourceType")
    .populate("reviewedBy", "fullName email");

  res.status(200).json({
    message: "Flag updated successfully.",
    flag: populated,
  });
});

/**
 * PATCH /api/attorney/contracts/:id/complete
 * Finalizes contract review, sets status to 'completed', and releases report.
 */
const completeReview = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);

  if (!contract) {
    res.status(404);
    throw new Error("Contract not found.");
  }

  const validOverrides = ["low", "medium", "high", null];
  if (
    req.body.attorneyRiskOverride !== undefined &&
    !validOverrides.includes(req.body.attorneyRiskOverride)
  ) {
    res.status(400);
    throw new Error(
      "attorneyRiskOverride must be: low, medium, high, or null.",
    );
  }

  contract.status = "completed";
  contract.reviewCompletedAt = new Date();

  if (req.body.attorneyNotes !== undefined) {
    contract.attorneyNotes = req.body.attorneyNotes.trim();
  }

  if (req.body.attorneyRiskOverride !== undefined) {
    contract.attorneyRiskOverride = req.body.attorneyRiskOverride;
  }

  contract.reportReleasedToClient = req.body.releaseReport !== false;
  if (contract.reportReleasedToClient) {
    contract.reportReleasedAt = new Date();
  }

  if (!contract.assignedAttorneyId) {
    contract.assignedAttorneyId = req.user._id;
  }

  await contract.save();

  const populated = await Contract.findById(contract._id)
    .populate("clientId", "fullName email")
    .populate("assignedAttorneyId", "fullName email");

  res.status(200).json({
    message: "Contract review completed.",
    contract: populated,
  });
});

module.exports = {
  getReviewQueue,
  assignContract,
  getContractFlags,
  updateFlag,
  completeReview,
};
