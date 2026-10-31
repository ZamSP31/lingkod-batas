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
function validateNewPassword(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 50 || Buffer.byteLength(value, "utf8") > 72) {
    fail("Password must be 8 to 50 characters and no more than 72 UTF-8 bytes.");
  }
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
    fail("Password must include an uppercase letter, a lowercase letter, and a number.");
  }
}
function validLoginPassword(value) {
  // Legacy passwords may exceed the current 50-character creation limit,
  // but input past bcrypt's 72-byte boundary must never be silently ignored.
  return typeof value === "string" && value.length > 0 && value.length <= 128 && Buffer.byteLength(value, "utf8") <= 72;
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

module.exports = { hash, otp, secret, fail, email, code, validateNewPassword, validLoginPassword, versionFilter, clearChallenges, publicUser };
