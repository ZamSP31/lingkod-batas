const AuditLog = require("../models/AuditLog");

/**
 * Extracts client IP address safely from Express request.
 */
function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || null;
}

/**
 * Centralized logging utility for system activity and legal audit trail.
 * Fail-safe: will never throw an exception or block core operational flows.
 *
 * @param {Object} params
 * @param {Object} [params.req] - Express request object (extracts IP and user agent automatically)
 * @param {Object} [params.user] - Explicit user object (fallback to req.user)
 * @param {string} [params.userId] - Explicit user ID
 * @param {string} [params.userName] - Display name of actor
 * @param {string} [params.userEmail] - Email of actor
 * @param {string} [params.userRole] - 'client' | 'attorney' | 'admin' | 'system'
 * @param {string} params.action - One of the AuditLog actions
 * @param {string} params.entityType - 'contract' | 'clause_flag' | 'statutory_source' | 'user' | 'auth' | 'system'
 * @param {string} [params.entityId] - ID of target entity
 * @param {string} [params.entityLabel] - Human-readable label (e.g. "LB-2026-0001", "DOLE D.O. 174-17")
 * @param {Object} [params.details] - Arbitrary JSON metadata
 */
async function logAction({
  req,
  user,
  userId,
  userName,
  userEmail,
  userRole,
  action,
  entityType,
  entityId,
  entityLabel,
  details = {},
}) {
  try {
    const activeUser = user || (req && req.user);

    const resolvedUserId =
      userId || (activeUser ? activeUser._id || activeUser.id : null);
    const resolvedUserName =
      userName ||
      (activeUser ? activeUser.fullName || activeUser.name : "System");
    const resolvedUserEmail =
      userEmail || (activeUser ? activeUser.email : null);
    const resolvedUserRole =
      userRole || (activeUser ? activeUser.role : "system");

    const ipAddress = getClientIp(req);
    const userAgent = req?.headers?.["user-agent"] || null;

    const logEntry = new AuditLog({
      userId: resolvedUserId,
      userName: resolvedUserName,
      userEmail: resolvedUserEmail,
      userRole: resolvedUserRole,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      entityLabel: entityLabel || null,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    await logEntry.save();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[auditService] Failed to record audit log (${action}):`,
      error.message,
    );
  }
}

module.exports = {
  logAction,
};
