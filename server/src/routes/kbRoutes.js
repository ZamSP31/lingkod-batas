const express = require("express");
const multer = require("multer");
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

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, PNG, JPEG, and TXT files are allowed."), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

// Read operations are accessible to all authenticated users (clients and attorneys)
router.get("/", protect, getSources);
router.get("/:id", protect, getSourceById);

// Write operations are restricted to attorney and admin roles
router.post("/", protect, authorize("attorney", "admin"), createSource);
router.patch("/:id", protect, authorize("attorney", "admin"), updateSource);
router.post(
  "/extract-text",
  protect,
  authorize("attorney", "admin"),
  upload.single("documentFile"),
  extractTextFromDocument,
);

router.post(
  "/",
  protect,
  authorize("attorney", "admin"),
  upload.single("documentFile"),
  createSource,
);

router.patch(
  "/:id",
  protect,
  authorize("attorney", "admin"),
  upload.single("documentFile"),
  updateSource,
);

router.delete("/:id", protect, authorize("attorney", "admin"), deleteSource);

module.exports = router;
