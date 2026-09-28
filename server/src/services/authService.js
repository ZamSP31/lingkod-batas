const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const { sendOtpEmail } = require("./emailService");

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const sendRegistrationOtp = async ({ fullName, email }) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error("An account with this email already exists.");
    err.statusCode = 409;
    throw err;
  }

  // Generate 6-digit numeric OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  await PendingRegistration.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      fullName: (fullName || "").trim(),
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
    { upsert: true, new: true },
  );

  await sendOtpEmail({
    toEmail: normalizedEmail,
    otp,
    fullName,
    purpose: "registration",
  });

  return {
    message: "A 6-digit verification code has been dispatched to your email.",
    devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
  };
};

const registerClient = async ({ fullName, email, password, otp }) => {
  const normalizedEmail = (email || "").toLowerCase().trim();

  // Validate OTP
  if (!otp) {
    const err = new Error(
      "Verification code is required to complete registration.",
    );
    err.statusCode = 400;
    throw err;
  }

  const cleanOtp = otp.toString().trim();
  const hashedOtp = crypto.createHash("sha256").update(cleanOtp).digest("hex");

  const pending = await PendingRegistration.findOne({
    email: normalizedEmail,
    otp: hashedOtp,
    expiresAt: { $gt: Date.now() },
  });

  if (!pending) {
    const err = new Error(
      "The verification code is invalid or has expired. Please request a new code.",
    );
    err.statusCode = 400;
    throw err;
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error("An account with this email already exists.");
    err.statusCode = 409;
    throw err;
  }

  // role is intentionally not accepted from the request body —
  // self-registration is always 'client'. Attorneys are admin-created.
  const user = await User.create({
    fullName: fullName || pending.fullName,
    email: normalizedEmail,
    password,
    role: "client",
  });

  // Clean up pending registration record
  await PendingRegistration.deleteOne({ email: normalizedEmail });

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber || "",
      rollNumber: user.rollNumber || "",
    },
    token: generateToken(user._id, user.role),
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error("Invalid email or password.");
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("This account has been deactivated.");
    err.statusCode = 403;
    throw err;
  }

  // Generate 6-digit numeric 2FA OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.twoFactorOtp = hashedOtp;
  user.twoFactorOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Send 2FA email (or output to terminal in local development)
  await sendOtpEmail({
    toEmail: user.email,
    otp,
    fullName: user.fullName,
    purpose: "login_2fa",
  });

  return {
    requires2FA: true,
    email: user.email,
    message: "A 6-digit verification code has been dispatched to your email.",
    devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

const verifyLogin2FA = async ({ email, otp }) => {
  if (!email || !otp) {
    const err = new Error("Email and 6-digit verification code are required.");
    err.statusCode = 400;
    throw err;
  }

  const cleanOtp = otp.toString().trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    const err = new Error("Verification code must be exactly 6 digits.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedOtp = crypto.createHash("sha256").update(cleanOtp).digest("hex");

  const user = await User.findOne({
    email: normalizedEmail,
    twoFactorOtp: hashedOtp,
    twoFactorOtpExpires: { $gt: Date.now() },
  }).select("+twoFactorOtp +twoFactorOtpExpires");

  if (!user) {
    const err = new Error(
      "The verification code is invalid or has expired. Please request a new code.",
    );
    err.statusCode = 400;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("This account has been deactivated.");
    err.statusCode = 403;
    throw err;
  }

  // Clear 2FA OTP after successful consumption
  user.twoFactorOtp = undefined;
  user.twoFactorOtpExpires = undefined;
  await user.save();

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber || "",
      rollNumber: user.rollNumber || "",
    },
    token: generateToken(user._id, user.role),
  };
};

const resendLogin2FA = async (email) => {
  if (!email) {
    const err = new Error("Email is required.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.isActive) {
    const err = new Error("Account not found or inactive.");
    err.statusCode = 400;
    throw err;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.twoFactorOtp = hashedOtp;
  user.twoFactorOtpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendOtpEmail({
    toEmail: user.email,
    otp,
    fullName: user.fullName,
    purpose: "login_2fa",
  });

  return {
    message: "A new 6-digit verification code has been dispatched to your email.",
    devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
  };
};

const updateProfile = async (
  userId,
  { fullName, email, contactNumber, currentPassword, newPassword },
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing._id.toString() !== userId.toString()) {
      const err = new Error("An account with this email already exists.");
      err.statusCode = 409;
      throw err;
    }
    user.email = email.toLowerCase().trim();
  }

  if (fullName) {
    user.fullName = fullName.trim();
  }

  if (contactNumber !== undefined) {
    user.contactNumber = contactNumber.trim();
    user.phone = contactNumber.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      const err = new Error(
        "Current password is required to set a new password.",
      );
      err.statusCode = 400;
      throw err;
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const err = new Error("The current password you entered is incorrect.");
      err.statusCode = 400;
      throw err;
    }
    user.password = newPassword;
  }

  await user.save();

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    contactNumber: user.contactNumber || "",
    rollNumber: user.rollNumber || "",
  };
};

const requestPasswordReset = async (email) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  // If user does not exist or is inactive, return standard message to prevent user enumeration
  if (!user || !user.isActive) {
    return {
      message:
        "If an account is associated with this email, an encrypted password reset link has been dispatched.",
    };
  }

  // Generate 32-byte secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hash token with SHA-256 for database storage
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // 30 minute expiry
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000;
  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  console.log(`[AUTH] Password reset link generated for ${user.email}: ${resetUrl}`);

  return {
    message:
      "If an account is associated with this email, an encrypted password reset link has been dispatched.",
    resetToken: rawToken,
    resetUrl,
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

const resetPassword = async ({ token, newPassword }) => {
  if (!token) {
    const err = new Error("Reset token is required.");
    err.statusCode = 400;
    throw err;
  }

  if (!newPassword || newPassword.length < 8) {
    const err = new Error("Password must be at least 8 characters long.");
    err.statusCode = 400;
    throw err;
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    const err = new Error(
      "The password reset link is invalid or has expired. Please request a new one.",
    );
    err.statusCode = 400;
    throw err;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return {
    message: "Your password has been successfully reset. You can now log in.",
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

const sendPasswordResetOtp = async (email) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.isActive) {
    return {
      message:
        "If this email is associated with an active account, a 6-digit verification code has been dispatched.",
    };
  }

  // Generate 6-digit numeric OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP with SHA-256 for secure storage in MongoDB
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.resetPasswordOtp = hashedOtp;
  user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // Send the actual email (or log to terminal in dev mode)
  await sendOtpEmail({
    toEmail: user.email,
    otp,
    fullName: user.fullName,
  });

  return {
    message:
      "If this email is associated with an active account, a 6-digit verification code has been dispatched.",
    devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

const verifyPasswordResetOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    const err = new Error("Email and 6-digit verification code are required.");
    err.statusCode = 400;
    throw err;
  }

  const cleanOtp = otp.toString().trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    const err = new Error("Verification code must be exactly 6 digits.");
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashedOtp = crypto.createHash("sha256").update(cleanOtp).digest("hex");

  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordOtp: hashedOtp,
    resetPasswordOtpExpires: { $gt: Date.now() },
  }).select("+resetPasswordOtp +resetPasswordOtpExpires");

  if (!user) {
    const err = new Error(
      "The verification code is invalid or has expired. Please request a new code.",
    );
    err.statusCode = 400;
    throw err;
  }

  // Clear OTP so it cannot be used again
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpires = undefined;

  // Generate a short-lived reset token (15 mins) for updating the password
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  return {
    message: "Email identity successfully verified.",
    resetToken: rawToken,
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

module.exports = {
  registerClient,
  sendRegistrationOtp,
  login,
  verifyLogin2FA,
  resendLogin2FA,
  updateProfile,
  generateToken,
  requestPasswordReset,
  resetPassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
};
