const DAY_MS = 24 * 60 * 60 * 1000;
function oneYearFrom(value) {
  const date = new Date(value);
  const month = date.getUTCMonth();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  if (date.getUTCMonth() !== month) date.setUTCDate(0);
  return date;
}
function expiryFor(user) {
  return user.accountExpiresAt ? new Date(user.accountExpiresAt) : oneYearFrom(user.createdAt);
}
function renewalFields(user, now = new Date()) {
  if (user.role !== "client") return {};
  const expiry = expiryFor(user);
  if (!Number.isFinite(expiry.getTime()) || now.getTime() < expiry.getTime() - 30 * DAY_MS) return {};
  return { accountExpiresAt: oneYearFrom(now), accountWarningSentAt: null,
    accountDeleteAfter: null, accountWarningLeaseUntil: null };
}
module.exports = { DAY_MS, oneYearFrom, expiryFor, renewalFields };
