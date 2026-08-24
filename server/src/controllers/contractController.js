const asyncHandler = require("express-async-handler");
const Contract = require("../models/Contract");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinaryService");
const ocrService = require("../services/ocrService");

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

  const validTypes = ["employment", "vendor", "service", "other"];
  if (!contractType || !validTypes.includes(contractType)) {
    res.status(400);
    throw new Error(
      "Contract type must be: employment, vendor, service, or other.",
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded.");
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

  if (
    req.user.role !== "attorney" &&
    contract.clientId._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Access denied.");
  }

  const ContractFlag = require("../models/ContractFlag");
  const flags = await ContractFlag.find({ contractId: req.params.id })
    .sort({ clauseIndex: 1 })
    .populate("statutoryBases.sourceId", "title citation sourceType")
    .populate("reviewedBy", "fullName email");

  res.status(200).json({
    contract,
    flags,
  });
});

module.exports = {
  submitContract,
  getContracts,
  getContractById,
  getContractReport,
};
