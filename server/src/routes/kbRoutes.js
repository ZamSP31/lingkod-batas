const express = require("express");
const {
  getSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
} = require("../controllers/kbController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Read operations are accessible to all authenticated users (clients and attorneys)
router.get("/", protect, getSources);
router.get("/:id", protect, getSourceById);

// Write operations are restricted to attorney and admin roles
router.post("/", protect, authorize("attorney", "admin"), createSource);
router.patch("/:id", protect, authorize("attorney", "admin"), updateSource);
router.delete("/:id", protect, authorize("attorney", "admin"), deleteSource);

module.exports = router;
