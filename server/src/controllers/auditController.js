const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/AuditLog");

const CATEGORY_ACTIONS = {
  contracts: ["CONTRACT_SUBMITTED", "REPORT_VIEWED", "REPORT_DOWNLOADED"],
  ai: ["OCR_PROCESSED", "AI_ANALYSIS_COMPLETED"],
  reviews: [
    "CONTRACT_ASSIGNED",
    "FLAG_REVIEWED",
    "FLAG_OVERRIDDEN",
    "REVIEW_COMPLETED",
  ],
  statutory: [
    "STATUTORY_SOURCE_CREATED",
    "STATUTORY_SOURCE_UPDATED",
    "STATUTORY_SOURCE_DELETED",
  ],
  auth: ["USER_LOGIN", "USER_REGISTER"],
};

/**
 * GET /api/audit-logs
 * Retrieves paginated audit log entries with category and keyword filters.
 * Restricted to attorney and admin roles.
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    q,
    action,
    category,
    entityType,
    entityId,
    page = 1,
    limit = 25,
  } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

  const filter = {};

  if (action) {
    filter.action = action;
  } else if (category && CATEGORY_ACTIONS[category]) {
    filter.action = { $in: CATEGORY_ACTIONS[category] };
  }

  if (entityType) {
    filter.entityType = entityType;
  }

  if (entityId) {
    filter.$or = [
      { entityId: String(entityId) },
      { "details.contractId": String(entityId) },
    ];
  }

  if (q && q.trim()) {
    const term = q.trim();
    const searchRegex = { $regex: term, $options: "i" };
    filter.$or = [
      { action: searchRegex },
      { userName: searchRegex },
      { userEmail: searchRegex },
      { entityLabel: searchRegex },
      { ipAddress: searchRegex },
    ];
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean();

  res.status(200).json({
    logs,
    total,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
  });
});

/**
 * GET /api/audit-logs/contract/:contractId
 * Retrieves the complete chronological audit trail for a specific contract.
 */
const getContractAuditTrail = asyncHandler(async (req, res) => {
  const { contractId } = req.params;

  const logs = await AuditLog.find({
    $or: [
      { entityId: String(contractId) },
      { "details.contractId": String(contractId) },
    ],
  })
    .sort({ timestamp: 1 })
    .lean();

  res.status(200).json({
    contractId,
    count: logs.length,
    trail: logs,
  });
});

/**
 * GET /api/audit-logs/export
 * Exports matching audit logs as a downloadable CSV.
 */
const exportAuditLogsCsv = asyncHandler(async (req, res) => {
  const { category, action } = req.query;
  const filter = {};

  if (action) {
    filter.action = action;
  } else if (category && CATEGORY_ACTIONS[category]) {
    filter.action = { $in: CATEGORY_ACTIONS[category] };
  }

  const logs = await AuditLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(2000)
    .lean();

  const headers = [
    "Timestamp",
    "Action",
    "User Name",
    "User Email",
    "Role",
    "Entity Type",
    "Entity Label / ID",
    "IP Address",
    "Details",
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = logs.map((log) => [
    escapeCsv(new Date(log.timestamp).toISOString()),
    escapeCsv(log.action),
    escapeCsv(log.userName),
    escapeCsv(log.userEmail),
    escapeCsv(log.userRole),
    escapeCsv(log.entityType),
    escapeCsv(log.entityLabel || log.entityId),
    escapeCsv(log.ipAddress),
    escapeCsv(log.details),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="lingkod-batas-audit-logs-${Date.now()}.csv"`,
  );
  res.status(200).send(csvContent);
});

module.exports = {
  getAuditLogs,
  getContractAuditTrail,
  exportAuditLogsCsv,
};
