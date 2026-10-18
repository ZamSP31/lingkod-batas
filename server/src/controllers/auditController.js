const asyncHandler = require("express-async-handler");
const AuditLog = require("../models/AuditLog");
const Contract = require("../models/Contract");
const access = require("../services/contractAccess");
const { escapeRegex, sanitizeCsvCell } = require("../utils/securityUtils");

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
  auth: ["USER_LOGIN", "USER_REGISTER", "USER_PROFILE_UPDATE", "ACCOUNT_EXPIRY_WARNING", "ACCOUNT_EXPIRED_DELETED"],
};

function parseAuditDate(value, name) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error = new Error(`${name} must be a valid date in YYYY-MM-DD format.`);
    error.statusCode = 400;
    throw error;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    const error = new Error(`${name} must be a valid calendar date.`);
    error.statusCode = 400;
    throw error;
  }
  return date.getTime() - 8 * 60 * 60 * 1000;
}

function buildAuditFilter(req) {
  const { q, action, category, entityType, entityId, fromDate, toDate } = req.query;
  const filter = req.user.role === "admin" ? {} : { userId: req.user._id };

  if (action) {
    filter.action = action;
  } else if (category && CATEGORY_ACTIONS[category]) {
    filter.action = { $in: CATEGORY_ACTIONS[category] };
  }

  if (entityType) {
    filter.entityType = entityType;
  }

  if (entityId) {
    filter.$and = [{ $or: [
      { entityId: String(entityId) },
      { "details.contractId": String(entityId) },
    ] }];
  }

  if (q && q.trim()) {
    const safeTerm = escapeRegex(q.trim());
    const searchRegex = { $regex: safeTerm, $options: "i" };
    filter.$or = [
      { action: searchRegex },
      { userName: searchRegex },
      { userEmail: searchRegex },
      { entityLabel: searchRegex },
      { ipAddress: searchRegex },
    ];
  }

  const from = fromDate === undefined ? undefined : parseAuditDate(fromDate, "From date");
  const to = toDate === undefined ? undefined : parseAuditDate(toDate, "To date");
  if (from !== undefined && to !== undefined && from > to) {
    const error = new Error("From date must be on or before To date.");
    error.statusCode = 400;
    throw error;
  }
  if (from !== undefined || to !== undefined) {
    filter.timestamp = {
      ...(from !== undefined ? { $gte: new Date(from) } : {}),
      ...(to !== undefined ? { $lt: new Date(to + 24 * 60 * 60 * 1000) } : {}),
    };
  }
  return filter;
}

/**
 * GET /api/audit-logs
 * Retrieves paginated audit log entries with category and keyword filters.
 * Restricted to attorney and admin roles.
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 25 } = req.query;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const filter = buildAuditFilter(req);

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
  if (req.user.role !== "admin") {
    const contract = await Contract.findById(contractId);
    if (!contract) access.deny("Contract not found.", 404);
    access.assertRead(req.user, contract);
  }

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
  const filter = buildAuditFilter(req);

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

  const rows = logs.map((log) => [
    sanitizeCsvCell(new Date(log.timestamp).toISOString()),
    sanitizeCsvCell(log.action),
    sanitizeCsvCell(log.userName),
    sanitizeCsvCell(log.userEmail),
    sanitizeCsvCell(log.userRole),
    sanitizeCsvCell(log.entityType),
    sanitizeCsvCell(log.entityLabel || log.entityId),
    sanitizeCsvCell(log.ipAddress),
    sanitizeCsvCell(log.details),
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
