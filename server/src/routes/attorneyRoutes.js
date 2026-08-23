const express = require("express");
const {
  getReviewQueue,
  assignContract,
  getContractFlags,
  updateFlag,
  completeReview,
} = require("../controllers/attorneyController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All attorney endpoints require a valid token and the 'attorney' role
router.use(protect, authorize("attorney"));

router.get("/queue", getReviewQueue);
router.patch("/contracts/:id/assign", assignContract);
router.get("/contracts/:id/flags", getContractFlags);
router.patch("/flags/:flagId", updateFlag);
router.patch("/contracts/:id/complete", completeReview);

module.exports = router;
