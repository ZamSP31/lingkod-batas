const express = require("express");
const {
  getAuditLogs,
  getContractAuditTrail,
  exportAuditLogsCsv,
} = require("../controllers/auditController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.use(authorize("attorney", "admin"));

router.get("/", getAuditLogs);
router.get("/export", exportAuditLogsCsv);
router.get("/contract/:contractId", getContractAuditTrail);

module.exports = router;
