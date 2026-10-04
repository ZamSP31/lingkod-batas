const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const {
  submitContract,
  getContracts,
  getContractById,
  getContractReport,
  getContractStatus,
} = require("../controllers/contractController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Contract upload requests: max 25 uploads per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Contract upload limit reached for this hour. Please try again later.",
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PNG, and JPEG files are allowed."), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max per system specification
});

// All routes require login
router.use(protect);

// Both clients and attorneys can submit contracts for analysis (rate-limited)
router.post(
  "/",
  uploadLimiter,
  authorize("client", "attorney"),
  upload.single("contractFile"),
  submitContract,
);

// Both roles can list and view contracts (controller filters by role internally)
router.get("/", getContracts);
router.get("/:id", getContractById);
router.get("/:id/status", getContractStatus);
router.get("/:id/report", getContractReport);

module.exports = router;
