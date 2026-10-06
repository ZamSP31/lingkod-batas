const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const {
  extractTextFromDocument,
  getSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
} = require("../controllers/kbController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Extraction rate limiter: max 15 text extractions per 15 minutes per IP (CWE-400 mitigation)
const extractLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Extraction rate limit reached. Please wait a few minutes before extracting more documents.",
  },
});

// Allowed document types for statutory knowledge base
const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/plain",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error("Only PDF, PNG, JPEG, and TXT files are allowed.");
    error.statusCode = 400;
    cb(error, false);
  }
};

// 5MB limit for extraction to prevent CPU/memory exhaustion during OCR
const extractUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// 20MB limit for full statutory source document archiving
const sourceUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

// Graceful Multer error handler to ensure 400 Bad Request on size/type violations
const handleUploadError = (uploadMiddleware, sizeLimitMb) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      res.status(400);
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new Error(`File size exceeds the ${sizeLimitMb}MB limit.`)
        );
      }
      return next(err);
    }
    next();
  });
};

// Read operations are accessible to all authenticated users (clients and attorneys)
router.get("/", protect, getSources);
router.get("/:id", protect, getSourceById);

// Text extraction: rate-limited, 5MB ceiling, restricted to attorney and admin
router.post(
  "/extract-text",
  protect,
  authorize("attorney", "admin"),
  extractLimiter,
  handleUploadError(extractUpload.single("documentFile"), 5),
  extractTextFromDocument
);

// Write operations: restricted to attorney and admin roles
router.post(
  "/",
  protect,
  authorize("attorney", "admin"),
  handleUploadError(sourceUpload.single("documentFile"), 20),
  createSource
);

router.patch(
  "/:id",
  protect,
  authorize("attorney", "admin"),
  handleUploadError(sourceUpload.single("documentFile"), 20),
  updateSource
);

router.delete("/:id", protect, authorize("attorney", "admin"), deleteSource);

module.exports = router;
