const asyncHandler = require("express-async-handler");
const Contract = require("../models/Contract");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinaryService");
const ocrService = require("../services/ocrService");
const { isValidDocumentBuffer } = require("../utils/fileValidation");

/**
 * POST /api/contracts
 * Client submits a contract file for review.
 */
const submitContract = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  const contractType = req.body.contractType?.trim();

  // Manual validation (express-validator body() can't read multipart fields before multer)
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error("Contract title is required.");
  }

  const validTypes = [
    "regular",
    "probationary",
    "project_based",
    "fixed_term",
    "employment",
    "vendor",
    "service",
    "other",
  ];
  if (!contractType || !validTypes.includes(contractType)) {
    res.status(400);
    throw new Error(
      "Contract type must be: regular, probationary, project_based, or fixed_term.",
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded.");
  }

  if (!isValidDocumentBuffer(req.file.buffer, req.file.mimetype)) {
    res.status(400);
    throw new Error(
      "Corrupted or invalid document file: binary content does not match the declared MIME format.",
    );
  }

  let cloudinaryUpload = null;

  try {
    // 1. Upload file to Cloudinary
    cloudinaryUpload = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    const mimeToExt = {
      "application/pdf": "pdf",
      "image/png": "png",
      "image/jpeg": "jpeg",
      "image/jpg": "jpg",
    };

    // 2. Save to MongoDB — requestNumber auto-generated in pre-save hook
    const contract = new Contract({
      clientId: req.user._id,
      title: title.trim(),
      contractType,
      cloudinaryUrl: cloudinaryUpload.url,
      cloudinaryPublicId: cloudinaryUpload.publicId,
      fileSize: req.file.size,
      fileName: req.file.originalname,
      fileType: mimeToExt[req.file.mimetype] || "pdf",
      status: "pending",
    });

    await contract.save();

    // 3. Trigger OCR pipeline in background (non-blocking)
    setImmediate(() => {
      ocrService
        .processContract(contract._id, req.file.buffer, req.file.mimetype)
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(
            `[Background OCR Error] Contract ${contract._id}:`,
            err.message,
          );
        });
    });

    const { logAction } = require("../services/auditService");
    await logAction({
      req,
      action: "CONTRACT_SUBMITTED",
      entityType: "contract",
      entityId: contract._id,
      entityLabel: contract.requestNumber || contract.title,
      details: {
        requestNumber: contract.requestNumber,
        title: contract.title,
        contractType: contract.contractType,
        fileName: contract.fileName,
        fileSize: contract.fileSize,
      },
    });

    const {
      createNotification,
      notifyAttorneys,
    } = require("../services/notificationService");
    await createNotification({
      recipient: req.user._id,
      contract: contract._id,
      type: "contract-submitted",
      title: "Contract Submitted",
      message: `Your contract "${contract.title}" was submitted successfully. Request #${contract.requestNumber}.`,
      link: `/client/track-status/${contract._id}`,
    });

    await notifyAttorneys({
      contract: contract._id,
      type: "contract-submitted",
      title: "New Contract Queued",
      message: `New contract "${contract.title}" (Request #${contract.requestNumber}) submitted by ${req.user.fullName || "Client"}.`,
      link: `/attorney/review-queue/${contract._id}`,
    });

    res.status(201).json({
      message: "Contract submitted successfully.",
      contract: {
        id: contract._id,
        requestNumber: contract.requestNumber,
        title: contract.title,
        contractType: contract.contractType,
        status: contract.status,
        fileName: contract.fileName,
        fileType: contract.fileType,
        createdAt: contract.createdAt,
      },
    });
  } catch (error) {
    // If DB save failed after Cloudinary upload, clean up the orphaned file
    if (cloudinaryUpload) {
      const resourceType =
        req.file.mimetype === "application/pdf" ? "raw" : "image";
      await deleteFromCloudinary(cloudinaryUpload.publicId, resourceType).catch(
        () => {},
      );
    }
    throw error;
  }
});

/**
 * GET /api/contracts
 * Client: sees only their own. Attorney: sees all.
 */
const getContracts = asyncHandler(async (req, res) => {
  const filter = req.user.role === "attorney" ? {} : { clientId: req.user._id };

  const contracts = await Contract.find(filter)
    .sort({ createdAt: -1 })
    .select("-rawOcrText")
    .populate("clientId", "fullName email")
    .populate("assignedAttorneyId", "fullName email");

  res.status(200).json({ contracts });
});

/**
 * GET /api/contracts/:id
 * Client can only see their own; attorney can see any.
 */
const getContractById = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id)
    .populate("clientId", "fullName email")
    .populate("assignedAttorneyId", "fullName email");

  if (!contract) {
    res.status(404);
    throw new Error("Contract not found.");
  }

  if (
    req.user.role !== "attorney" &&
    contract.clientId._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Access denied.");
  }

  res.status(200).json({ contract });
});

/**
 * GET /api/contracts/:id/report
 * Retrieves contract details along with its verified AI risk flags and attorney notes.
 */
const getContractReport = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id)
    .populate("clientId", "fullName email")
    .populate("assignedAttorneyId", "fullName email");

  if (!contract) {
    res.status(404);
    throw new Error("Contract not found.");
  }

  if (req.user.role !== "attorney") {
    if (contract.clientId._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Access denied.");
    }
    // Mandatory Gatekeeping (Rule 4): Clients cannot access analysis report until attorney completes review and releases it
    if (contract.status !== "completed" || !contract.reportReleasedToClient) {
      res.status(403);
      throw new Error(
        "This contract review is currently pending attorney review. The finalized analysis report has not yet been released.",
      );
    }
  }

  const ContractFlag = require("../models/ContractFlag");
  const flags = await ContractFlag.find({ contractId: req.params.id })
    .sort({ clauseIndex: 1 })
    .populate("statutoryBases.sourceId", "title citation sourceType")
    .populate("reviewedBy", "fullName email");

  const { logAction } = require("../services/auditService");
  await logAction({
    req,
    action: "REPORT_VIEWED",
    entityType: "contract",
    entityId: contract._id,
    entityLabel: contract.requestNumber || contract.title,
    details: {
      requestNumber: contract.requestNumber,
      title: contract.title,
      viewerRole: req.user.role,
    },
  });

  res.status(200).json({
    contract,
    flags,
  });
});

/**
 * GET /api/contracts/:id/status
 * Dedicated lightweight endpoint returning current contract pipeline status and stage.
 */
const getContractStatus = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id).select(
    "requestNumber title status ocrConfidence piiSanitized piiRedactionCount reportReleasedToClient clientId createdAt updatedAt",
  );

  if (!contract) {
    res.status(404);
    throw new Error("Contract not found.");
  }

  if (
    req.user.role !== "attorney" &&
    contract.clientId.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Access denied.");
  }

  const stageMap = {
    pending: 0,
    ocr_processing: 0,
    ai_analysis: 1,
    awaiting_attorney_review: 2,
    under_review: 3,
    completed: 4,
    rejected: 0,
  };

  res.status(200).json({
    id: contract._id,
    requestNumber: contract.requestNumber,
    title: contract.title,
    status: contract.status,
    stageIndex: stageMap[contract.status] ?? 0,
    reportReleasedToClient: contract.reportReleasedToClient,
    updatedAt: contract.updatedAt,
  });
});

module.exports = {
  submitContract,
  getContracts,
  getContractById,
  getContractReport,
  getContractStatus,
};
