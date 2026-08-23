const express = require("express");
const multer = require("multer");
const { body } = require("express-validator");
const {
  submitContract,
  getContracts,
  getContractById,
} = require("../controllers/contractController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// All routes require login
router.use(protect);

// Only clients can submit — attorneys review, not submit
router.post(
  "/",
  authorize("client"),
  upload.single("contractFile"),
  submitContract,
);

// Both roles can list and view contracts (controller filters by role internally)
router.get("/", getContracts);
router.get("/:id", getContractById);

module.exports = router;
