const asyncHandler = require("express-async-handler");
const StatutorySource = require("../models/StatutorySource");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../services/cloudinaryService");
const ocrService = require("../services/ocrService");
const { logAction } = require("../services/auditService");

/**
 * Helper to extract clean text from an uploaded document buffer (PDF, image, or text)
 */
async function extractTextFromBuffer(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const res = await ocrService.processDocument(buffer);
    return res.text || "";
  }
  if (["image/png", "image/jpeg", "image/jpg"].includes(mimetype)) {
    const res = await ocrService.processImage(buffer);
    return res.text || "";
  }
  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }
  return "";
}

/**
 * Helper to parse tags safely from body (supports array, JSON string, or comma-separated)
 */
function parseTags(tagsInput) {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput;
  if (typeof tagsInput === "string") {
    try {
      const parsed = JSON.parse(tagsInput);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not JSON, treat as comma-separated
      return tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/**
 * @desc    Extract text from an uploaded statutory file (PDF, image, text)
 * @route   POST /api/knowledge-base/extract-text
 * @access  Private (Attorney / Admin)
 */
const extractTextFromDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No document file uploaded.");
  }

  const rawFilename = req.file.originalname || "document.pdf";
  const cleanTitle = rawFilename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  let extractedText = "";
  try {
    extractedText = await extractTextFromBuffer(
      req.file.buffer,
      req.file.mimetype,
    );
  } catch (err) {
    res.status(422);
    throw new Error(`Failed to extract text from file: ${err.message}`);
  }

  // Basic citation heuristic: if filename contains "DOLE" or "D.O." or "RA" or "Art"
  let suggestedCitation = "";
  const citationMatch = rawFilename.match(
    /(?:DOLE[_\s-]*D\.?O\.?[_\s-]*\d+[-\d]*|RA[_\s-]*\d+|Art(?:icle)?[_\s-]*\d+)/i,
  );
  if (citationMatch) {
    suggestedCitation = citationMatch[0].replace(/_/g, " ");
  }

  res.status(200).json({
    text: extractedText.trim(),
    fileName: rawFilename,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    suggestedTitle: cleanTitle,
    suggestedCitation,
  });
});

/**
 * @desc    Get all statutory sources with full-text search, filtering, and pagination
 * @route   GET /api/knowledge-base
 * @access  Private
 */
const getSources = asyncHandler(async (req, res) => {
  const {
    q,
    sourceType,
    tag,
    page = 1,
    limit = 50,
    activeOnly = "true",
  } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

  const filter = {};

  if (activeOnly === "true") {
    filter.isActive = true;
  }

  if (sourceType) {
    filter.sourceType = sourceType;
  }

  if (tag) {
    filter.tags = tag;
  }

  if (q && q.trim()) {
    const searchTerm = q.trim();
    filter.$or = [
      { citation: { $regex: searchTerm, $options: "i" } },
      { title: { $regex: searchTerm, $options: "i" } },
      { provisionText: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const total = await StatutorySource.countDocuments(filter);
  const sources = await StatutorySource.find(filter)
    .sort({ updatedAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .populate("addedBy", "fullName email")
    .populate("lastUpdatedBy", "fullName email");

  res.status(200).json({
    sources,
    total,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
  });
});

/**
 * @desc    Get single statutory source by ID
 * @route   GET /api/knowledge-base/:id
 * @access  Private
 */
const getSourceById = asyncHandler(async (req, res) => {
  const source = await StatutorySource.findById(req.params.id)
    .populate("addedBy", "fullName email")
    .populate("lastUpdatedBy", "fullName email");

  if (!source) {
    res.status(404);
    throw new Error("Statutory source not found.");
  }

  res.status(200).json({ source });
});

/**
 * @desc    Create a new statutory source provision (supports file upload)
 * @route   POST /api/knowledge-base
 * @access  Private (Attorney / Admin)
 */
const createSource = asyncHandler(async (req, res) => {
  const { citation, title, sourceType, provisionNumber, tags, issuanceDate } =
    req.body;

  let { provisionText } = req.body;

  // If provisionText is missing but a file is uploaded, extract text automatically
  if ((!provisionText || !provisionText.trim()) && req.file) {
    provisionText = await extractTextFromBuffer(
      req.file.buffer,
      req.file.mimetype,
    );
  }

  if (
    !citation ||
    !title ||
    !sourceType ||
    !provisionText ||
    !provisionText.trim()
  ) {
    res.status(400);
    throw new Error(
      "Citation, title, sourceType, and provisionText are required.",
    );
  }

  const existing = await StatutorySource.findOne({ citation: citation.trim() });
  if (existing) {
    res.status(409);
    throw new Error("A statutory source with this citation already exists.");
  }

  let fileData = {
    fileUrl: null,
    filePublicId: null,
    fileName: null,
    fileSize: null,
    fileType: null,
  };

  // If a file was attached, upload it to Cloudinary under statutory folder
  if (req.file) {
    try {
      const uploadRes = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "lingkod-batas/statutory",
      );
      const mimeToExt = {
        "application/pdf": "pdf",
        "image/png": "png",
        "image/jpeg": "jpeg",
        "image/jpg": "jpg",
        "text/plain": "txt",
      };
      fileData = {
        fileUrl: uploadRes.url,
        filePublicId: uploadRes.publicId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: mimeToExt[req.file.mimetype] || "pdf",
      };
    } catch (uploadErr) {
      // eslint-disable-next-line no-console
      console.warn(
        "[Statutory Upload] Cloudinary upload warning:",
        uploadErr.message,
      );
    }
  }

  const source = await StatutorySource.create({
    citation: citation.trim(),
    title: title.trim(),
    sourceType,
    provisionNumber: provisionNumber ? provisionNumber.trim() : "",
    provisionText: provisionText.trim(),
    tags: parseTags(tags),
    issuanceDate: issuanceDate ? new Date(issuanceDate) : null,
    addedBy: req.user._id,
    ...fileData,
  });

  await logAction({
    req,
    action: "STATUTORY_SOURCE_CREATED",
    entityType: "statutory_source",
    entityId: source._id,
    entityLabel: source.citation,
    details: {
      citation: source.citation,
      title: source.title,
      sourceType: source.sourceType,
      hasFile: Boolean(source.fileUrl),
    },
  });

  res.status(201).json({
    message: "Statutory source created successfully.",
    source,
  });
});

/**
 * @desc    Update a statutory source provision (supports file replacement)
 * @route   PATCH /api/knowledge-base/:id
 * @access  Private (Attorney / Admin)
 */
const updateSource = asyncHandler(async (req, res) => {
  const source = await StatutorySource.findById(req.params.id);

  if (!source) {
    res.status(404);
    throw new Error("Statutory source not found.");
  }

  const {
    citation,
    title,
    sourceType,
    provisionNumber,
    provisionText,
    tags,
    issuanceDate,
    isActive,
    removeFile,
  } = req.body;

  if (citation && citation.trim() !== source.citation) {
    const existing = await StatutorySource.findOne({
      citation: citation.trim(),
      _id: { $ne: source._id },
    });
    if (existing) {
      res.status(409);
      throw new Error("Another statutory source already uses this citation.");
    }
    source.citation = citation.trim();
  }

  if (title) source.title = title.trim();
  if (sourceType) source.sourceType = sourceType;
  if (provisionNumber !== undefined)
    source.provisionNumber = provisionNumber.trim();
  if (provisionText) source.provisionText = provisionText.trim();
  if (tags !== undefined) source.tags = parseTags(tags);
  if (issuanceDate !== undefined) {
    source.issuanceDate = issuanceDate ? new Date(issuanceDate) : null;
  }
  if (isActive !== undefined) source.isActive = Boolean(isActive);

  // Handle file removal
  if (removeFile === "true" || removeFile === true) {
    if (source.filePublicId) {
      const resType = source.fileType === "pdf" ? "raw" : "image";
      await deleteFromCloudinary(source.filePublicId, resType).catch(() => {});
    }
    source.fileUrl = null;
    source.filePublicId = null;
    source.fileName = null;
    source.fileSize = null;
    source.fileType = null;
  }

  // Handle new file upload replacement
  if (req.file) {
    if (source.filePublicId) {
      const oldResType = source.fileType === "pdf" ? "raw" : "image";
      await deleteFromCloudinary(source.filePublicId, oldResType).catch(
        () => {},
      );
    }

    try {
      const uploadRes = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "lingkod-batas/statutory",
      );
      const mimeToExt = {
        "application/pdf": "pdf",
        "image/png": "png",
        "image/jpeg": "jpeg",
        "image/jpg": "jpg",
        "text/plain": "txt",
      };
      source.fileUrl = uploadRes.url;
      source.filePublicId = uploadRes.publicId;
      source.fileName = req.file.originalname;
      source.fileSize = req.file.size;
      source.fileType = mimeToExt[req.file.mimetype] || "pdf";
    } catch (uploadErr) {
      // eslint-disable-next-line no-console
      console.warn(
        "[Statutory Upload] Cloudinary upload warning:",
        uploadErr.message,
      );
    }
  }

  source.lastUpdatedBy = req.user._id;

  const updatedSource = await source.save();

  await logAction({
    req,
    action: "STATUTORY_SOURCE_UPDATED",
    entityType: "statutory_source",
    entityId: updatedSource._id,
    entityLabel: updatedSource.citation,
    details: {
      citation: updatedSource.citation,
      title: updatedSource.title,
      isActive: updatedSource.isActive,
    },
  });

  res.status(200).json({
    message: "Statutory source updated successfully.",
    source: updatedSource,
  });
});

/**
 * @desc    Delete a statutory source provision (supports permanent or soft delete)
 * @route   DELETE /api/knowledge-base/:id
 * @access  Private (Attorney / Admin)
 */
const deleteSource = asyncHandler(async (req, res) => {
  const source = await StatutorySource.findById(req.params.id);

  if (!source) {
    res.status(404);
    throw new Error("Statutory source not found.");
  }

  const deletedCitation = source.citation;
  const deletedTitle = source.title;

  // Clean up linked Cloudinary document file if present
  if (source.filePublicId) {
    const resType = source.fileType === "pdf" ? "raw" : "image";
    await deleteFromCloudinary(source.filePublicId, resType).catch(() => {});
  }

  // If soft-delete is specifically requested
  if (req.query.soft === "true") {
    source.isActive = false;
    source.lastUpdatedBy = req.user._id;
    await source.save();

    await logAction({
      req,
      action: "STATUTORY_SOURCE_DELETED",
      entityType: "statutory_source",
      entityId: source._id,
      entityLabel: deletedCitation,
      details: {
        mode: "soft_deactivate",
        citation: deletedCitation,
        title: deletedTitle,
      },
    });

    return res.status(200).json({
      message: "Statutory source deactivated successfully.",
      sourceId: source._id,
    });
  }

  // Default: permanent delete from DB
  await StatutorySource.findByIdAndDelete(req.params.id);

  await logAction({
    req,
    action: "STATUTORY_SOURCE_DELETED",
    entityType: "statutory_source",
    entityId: req.params.id,
    entityLabel: deletedCitation,
    details: {
      mode: "permanent_delete",
      citation: deletedCitation,
      title: deletedTitle,
    },
  });

  res.status(200).json({
    message: "Statutory source deleted successfully.",
    sourceId: req.params.id,
  });
});

module.exports = {
  extractTextFromDocument,
  getSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
};
