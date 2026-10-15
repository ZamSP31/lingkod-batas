const crypto = require("node:crypto");

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const otp = () => crypto.randomInt(100000, 1000000).toString();
const secret = () => crypto.randomBytes(32).toString("hex");
function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}
function email(value) {
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    fail("A valid email address is required.");
  }
  return value.trim().toLowerCase();
}
function code(value) {
  if (typeof value !== "string" || !/^\d{6}$/.test(value)) fail("Verification code must be exactly 6 digits.");
  return value;
}
// Existing users may have no persisted version until their first credential change.
function versionFilter(version) {
  if (!Number.isInteger(version) || version < 0) fail("Session expired. Please sign in again.", 401);
  return version === 0
    ? { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] }
    : { sessionVersion: version };
}
const clearChallenges = {
  loginChallengeHash: 1, loginChallengeExpires: 1, loginOtpSentAt: 1,
  twoFactorOtp: 1, twoFactorOtpExpires: 1, twoFactorOtpAttempts: 1,
  resetPasswordToken: 1, resetPasswordExpires: 1, resetPasswordOtp: 1,
  resetPasswordOtpExpires: 1, resetPasswordOtpAttempts: 1,
  pendingEmail: 1, emailChangeOtp: 1, emailChangeExpires: 1, emailChangeAttempts: 1,
};
function publicUser(user) {
  return { id: user._id, fullName: user.fullName, email: user.email, role: user.role,
    contactNumber: user.contactNumber || "", rollNumber: user.rollNumber || "",
    notificationSettings: user.notificationSettings || { emailNotifications: true, inAppNotifications: true } };
}

module.exports = { hash, otp, secret, fail, email, code, versionFilter, clearChallenges, publicUser };
