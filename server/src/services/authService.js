const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const security = require("./authSecurity");
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const Contract = require("../models/Contract");
const ContractFlag = require("../models/ContractFlag");
const Notification = require("../models/Notification");
const { deleteFromCloudinary } = require("./cloudinaryService");
const { sendOtpEmail } = require("./emailService");

const generateToken = (userId, role, sessionVersion = 0) => {
  return jwt.sign({ id: userId, role, sessionVersion, purpose: "access" }, process.env.JWT_SECRET, {
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
  const otp = security.otp();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  await PendingRegistration.findOneAndUpdate(
    { email: normalizedEmail },
    {
      email: normalizedEmail,
      fullName: (fullName || "").trim(),
      otp: hashedOtp,
      attempts: 0,
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
  };
};

const registerClient = async ({ fullName, email, password, otp }) => {
  const normalizedEmail = (email || "").toLowerCase().trim();

  // Validate OTP format
  if (!otp) {
    const err = new Error(
      "Verification code is required to complete registration.",
    );
    err.statusCode = 400;
    throw err;
  }

  const cleanOtp = otp.toString().trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    const err = new Error("Verification code must be exactly 6 digits.");
    err.statusCode = 400;
    throw err;
  }

  const pending = await PendingRegistration.findOneAndUpdate({
    email: normalizedEmail, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 },
  }, { $inc: { attempts: 1 } }, { new: true });
  const hashedOtp = security.hash(cleanOtp);
  if (!pending || pending.otp !== hashedOtp) security.fail("Invalid or expired registration verification. Request a new code if attempts are exhausted.", 401);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error("An account with this email already exists.");
    err.statusCode = 409;
    throw err;
  }

  const consumed = await PendingRegistration.deleteOne({ _id: pending._id, otp: hashedOtp,
    expiresAt: { $gt: new Date() }, attempts: { $lte: 5 } });
  if (consumed.deletedCount !== 1) security.fail("Verification already used or expired.", 401);

  // role is intentionally not accepted from the request body —
  // self-registration is always 'client'. Attorneys are admin-created.
  const user = await User.create({
    fullName: fullName || pending.fullName,
    email: normalizedEmail,
    password,
    role: "client",
  });

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber || "",
      rollNumber: user.rollNumber || "",
      notificationSettings: user.notificationSettings || {
        emailNotifications: true,
        inAppNotifications: true,
      },
    },
    token: generateToken(user._id, user.role, user.sessionVersion ?? 0),
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = security.email(email);
  if (typeof password !== "string" || password.length > 128) security.fail("Invalid email or password.", 401);
  const user = await User.findOne({ email: normalizedEmail }).select("+password +sessionVersion");
  if (!user || !user.isActive || !(await user.comparePassword(password))) security.fail("Invalid email or password.", 401);
  const challengeId = security.secret();
  const otp = security.otp();
  const updated = await User.findOneAndUpdate({ _id: user._id, email: user.email, password: user.password,
    isActive: true, ...security.versionFilter(user.sessionVersion ?? 0) }, { $set: {
      loginChallengeHash: security.hash(challengeId), loginChallengeExpires: new Date(Date.now() + 10 * 60 * 1000),
      twoFactorOtp: security.hash(otp), twoFactorOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      twoFactorOtpAttempts: 0, loginOtpSentAt: new Date(),
    } }, { new: true });
  if (!updated) security.fail("Account changed. Please sign in again.", 401);
  await sendOtpEmail({ toEmail: user.email, otp, fullName: user.fullName, purpose: "login_2fa" });
  return { requires2FA: true, email: user.email, challengeId,
    message: "A 6-digit verification code has been dispatched to your email.",
    userId: user._id, userEmail: user.email, userRole: user.role, userName: user.fullName };
};

function loginChallenge(email, challengeId) {
  if (typeof challengeId !== "string" || !/^[a-f0-9]{64}$/.test(challengeId)) security.fail("Please sign in with your password again.", 401);
  return { email: security.email(email), isActive: true, loginChallengeHash: security.hash(challengeId),
    loginChallengeExpires: { $gt: new Date() }, twoFactorOtpAttempts: { $lt: 5 } };
}

const verifyLogin2FA = async ({ email, otp, challengeId }) => {
  const cleanOtp = security.code(otp);
  const filter = loginChallenge(email, challengeId);
  // Reserve an attempt atomically before comparing. Concurrent guesses share the same budget.
  const candidate = await User.findOneAndUpdate(filter, { $inc: { twoFactorOtpAttempts: 1 } }, { new: true })
    .select("+twoFactorOtp +sessionVersion");
  if (!candidate || candidate.twoFactorOtp !== security.hash(cleanOtp)) security.fail("Invalid or expired verification. Sign in again if the code was used or attempts are exhausted.", 401);
  const user = await User.findOneAndUpdate({ ...filter, twoFactorOtpAttempts: { $lte: 5 },
    twoFactorOtp: security.hash(cleanOtp), ...security.versionFilter(candidate.sessionVersion ?? 0) }, {
      $unset: { loginChallengeHash: 1, loginChallengeExpires: 1, loginOtpSentAt: 1,
        twoFactorOtp: 1, twoFactorOtpExpires: 1, twoFactorOtpAttempts: 1 },
    }, { new: true }).select("+sessionVersion");
  if (!user) security.fail("Verification already used or expired. Please sign in again.", 401);
  return { user: security.publicUser(user), token: generateToken(user._id, user.role, user.sessionVersion ?? 0) };
};

const resendLogin2FA = async ({ email, challengeId }) => {
  const otp = security.otp();
  const user = await User.findOneAndUpdate({ ...loginChallenge(email, challengeId),
    loginOtpSentAt: { $lte: new Date(Date.now() - 60000) } }, {
      $set: { twoFactorOtp: security.hash(otp), loginOtpSentAt: new Date() },
    }, { new: true });
  if (!user) security.fail("Please wait 60 seconds before resending, or sign in again if verification expired.", 429);
  // Resend never extends challenge expiry or resets failed-attempt counts.
  await sendOtpEmail({ toEmail: user.email, otp, fullName: user.fullName, purpose: "login_2fa" });
  return { message: "A new verification code has been dispatched to your email." };
};

const updateProfile = async (userId, { fullName, email, contactNumber, currentPassword, newPassword, notificationSettings }, sessionVersion) => {
  const user = await User.findById(userId).select("+password +sessionVersion");
  if (!user || !user.isActive) security.fail("Account unavailable.", 401);
  if (email !== undefined && security.email(email) !== user.email) security.fail("Use the verified email change form to change your email.");
  const fields = {};
  if (fullName !== undefined) {
    if (typeof fullName !== "string" || !fullName.trim() || fullName.length > 150) security.fail("Invalid full name.");
    fields.fullName = fullName.trim();
  }
  if (contactNumber !== undefined) {
    if (typeof contactNumber !== "string" || contactNumber.length > 30) security.fail("Invalid contact number.");
    fields.contactNumber = contactNumber.trim(); fields.phone = contactNumber.trim();
  }
  if (notificationSettings !== undefined) {
    if (!notificationSettings || typeof notificationSettings !== "object") security.fail("Invalid notification settings.");
    for (const key of ["emailNotifications", "inAppNotifications"]) {
      if (notificationSettings[key] !== undefined) {
        if (typeof notificationSettings[key] !== "boolean") security.fail("Invalid notification settings.");
        fields[`notificationSettings.${key}`] = notificationSettings[key];
      }
    }
  }
  if (newPassword !== undefined) {
    if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) security.fail("New password must be between 8 and 128 characters.");
    if (typeof currentPassword !== "string" || !(await user.comparePassword(currentPassword))) security.fail("The current password is required and must be correct.", 403);
    // Query updates do not run Mongoose's password pre-save hook.
    fields.password = await bcrypt.hash(newPassword, 10);
  }
  const updated = await User.findOneAndUpdate({ _id: userId, isActive: true, password: user.password,
    ...security.versionFilter(sessionVersion) }, { $set: fields,
      ...(newPassword !== undefined ? { $inc: { sessionVersion: 1 }, $unset: security.clearChallenges } : {}),
    }, { new: true, runValidators: true });
  if (!updated) security.fail("Account changed. Please sign in again.", 401);
  return security.publicUser(updated);
};

const requestEmailChange = async (userId, { email, currentPassword }, sessionVersion) => {
  const newEmail = security.email(email);
  const user = await User.findById(userId).select("+password");
  if (!user || !user.isActive || typeof currentPassword !== "string" || !(await user.comparePassword(currentPassword))) security.fail("The current password is required and must be correct.", 403);
  if (newEmail === user.email) security.fail("Enter a different email address.");
  if (await User.findOne({ email: newEmail })) security.fail("That email address is unavailable.", 409);
  const otp = security.otp();
  const updated = await User.findOneAndUpdate({ _id: userId, isActive: true, password: user.password,
    ...security.versionFilter(sessionVersion) }, { $set: { pendingEmail: newEmail, emailChangeOtp: security.hash(otp),
      emailChangeExpires: new Date(Date.now() + 10 * 60 * 1000), emailChangeAttempts: 0 } }, { new: true });
  if (!updated) security.fail("Account changed. Please sign in again.", 401);
  await sendOtpEmail({ toEmail: newEmail, otp, fullName: user.fullName, purpose: "email_change" });
  return { message: "Verification code sent to your new email. Your current email remains active until confirmation." };
};

const confirmEmailChange = async (userId, { otp }, sessionVersion) => {
  const hashedOtp = security.hash(security.code(otp));
  const filter = { _id: userId, isActive: true, ...security.versionFilter(sessionVersion),
    emailChangeExpires: { $gt: new Date() }, emailChangeAttempts: { $lt: 5 } };
  const candidate = await User.findOneAndUpdate(filter, { $inc: { emailChangeAttempts: 1 } }, { new: true })
    .select("+pendingEmail +emailChangeOtp");
  if (!candidate || !candidate.pendingEmail || candidate.emailChangeOtp !== hashedOtp) security.fail("Invalid or expired email verification code.", 401);
  const user = await User.findOneAndUpdate({ ...filter, emailChangeAttempts: { $lte: 5 },
    pendingEmail: candidate.pendingEmail, emailChangeOtp: hashedOtp }, {
      $set: { email: candidate.pendingEmail }, $inc: { sessionVersion: 1 }, $unset: security.clearChallenges,
    }, { new: true, runValidators: true });
  if (!user) security.fail("Email verification already used or expired.", 401);
  return { message: "Email updated. Please sign in again with your new email." };
};

const requestPasswordReset = async (email) => {
  const normalizedEmail = security.email(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+sessionVersion");

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
  const updated = await User.findOneAndUpdate({ _id: user._id, email: normalizedEmail, isActive: true,
    ...security.versionFilter(user.sessionVersion ?? 0) }, { $set: {
      resetPasswordToken: hashedToken, resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000),
    } }, { new: true });
  if (!updated) return { message: "If an account is associated with this email, a password reset link has been dispatched." };

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  // Log reset link in development mode only
  if (process.env.NODE_ENV !== "production") {
    console.log(`[AUTH DEV] Password reset link generated for ${user.email}: ${resetUrl}`);
  }

  // NOTE: resetToken and resetUrl are intentionally NOT returned in the API response
  // to prevent unauthenticated 1-click account takeover (CWE-640).
  return {
    message:
      "If an account is associated with this email, an encrypted password reset link has been dispatched.",
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

const resetPassword = async ({ token, newPassword }) => {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    const err = new Error("Reset token is required.");
    err.statusCode = 400;
    throw err;
  }

  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
    const err = new Error("Password must be at least 8 characters long.");
    err.statusCode = 400;
    throw err;
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await User.findOneAndUpdate({
    resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: new Date() }, isActive: true,
  }, { $set: { password: passwordHash }, $inc: { sessionVersion: 1 },
    $unset: security.clearChallenges }, { new: true, runValidators: true });

  if (!user) {
    const err = new Error(
      "The password reset link is invalid or has expired. Please request a new one.",
    );
    err.statusCode = 400;
    throw err;
  }

  return {
    message: "Your password has been successfully reset. You can now log in.",
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

const sendPasswordResetOtp = async (email) => {
  const normalizedEmail = security.email(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+sessionVersion");

  if (!user || !user.isActive) {
    return {
      message:
        "If this email is associated with an active account, a 6-digit verification code has been dispatched.",
    };
  }

  // Generate 6-digit numeric OTP code
  const otp = security.otp();

  // Hash OTP with SHA-256 for secure storage in MongoDB
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const updated = await User.findOneAndUpdate({ _id: user._id, email: normalizedEmail, isActive: true,
    ...security.versionFilter(user.sessionVersion ?? 0) }, { $set: {
      resetPasswordOtp: hashedOtp, resetPasswordOtpExpires: new Date(Date.now() + 10 * 60 * 1000), resetPasswordOtpAttempts: 0,
    } }, { new: true });
  if (!updated) return { message: "If this email is associated with an active account, a verification code has been dispatched." };

  // Send the actual email (or log to terminal in dev mode)
  await sendOtpEmail({
    toEmail: user.email,
    otp,
    fullName: user.fullName,
  });

  return {
    message:
      "If this email is associated with an active account, a 6-digit verification code has been dispatched.",
    userId: user._id,
    userEmail: user.email,
    userRole: user.role,
    userName: user.fullName,
  };
};

const verifyPasswordResetOtp = async ({ email, otp }) => {
  const hashedOtp = security.hash(security.code(otp));
  const filter = { email: security.email(email), isActive: true,
    resetPasswordOtpExpires: { $gt: new Date() }, resetPasswordOtpAttempts: { $lt: 5 } };
  const candidate = await User.findOneAndUpdate(filter, { $inc: { resetPasswordOtpAttempts: 1 } }, { new: true })
    .select("+resetPasswordOtp +sessionVersion");
  if (!candidate || candidate.resetPasswordOtp !== hashedOtp) security.fail("Invalid or expired password reset verification.", 401);
  const rawToken = security.secret();
  const user = await User.findOneAndUpdate({ ...filter, resetPasswordOtpAttempts: { $lte: 5 },
    resetPasswordOtp: hashedOtp, ...security.versionFilter(candidate.sessionVersion ?? 0) }, {
      $set: { resetPasswordToken: security.hash(rawToken), resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000) },
      $unset: { resetPasswordOtp: 1, resetPasswordOtpExpires: 1, resetPasswordOtpAttempts: 1 },
    }, { new: true });
  if (!user) security.fail("Verification already used or expired.", 401);
  return { message: "Email identity successfully verified.", resetToken: rawToken,
    userId: user._id, userEmail: user.email, userRole: user.role, userName: user.fullName };
};

const deleteAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  // Prevent deleting attorneys or admins through client self-deletion
  if (user.role !== "client") {
    const err = new Error("Only client accounts can be self-deleted.");
    err.statusCode = 403;
    throw err;
  }

  // Cascade erasure under RA 10173 (Data Privacy Act of 2012)
  // 1. Find all contracts submitted by this client
  const contracts = await Contract.find({ clientId: userId });
  const contractIds = contracts.map((c) => c._id);

  // 2. Erase Cloudinary files
  for (const contract of contracts) {
    if (contract.cloudinaryPublicId) {
      const resourceType = contract.fileType === "pdf" ? "raw" : "image";
      await deleteFromCloudinary(contract.cloudinaryPublicId, resourceType, contract.cloudinaryDeliveryType || "upload").catch(
        (err) => {
          console.error(
            `Failed to delete Cloudinary file for contract ${contract._id}:`,
            err,
          );
        },
      );
    }
  }

  // 3. Delete ContractFlag records associated with client's contracts
  if (contractIds.length > 0) {
    await ContractFlag.deleteMany({ contractId: { $in: contractIds } });
  }

  // 4. Delete notifications (both recipient notifications and contract-associated notifications)
  await Notification.deleteMany({
    $or: [
      { recipient: userId },
      ...(contractIds.length > 0 ? [{ contract: { $in: contractIds } }] : []),
    ],
  });

  // 5. Delete Contract documents
  await Contract.deleteMany({ clientId: userId });

  // 6. Delete user account
  await User.findByIdAndDelete(userId);

  return { message: "Account and associated data successfully deleted." };
};

module.exports = {
  registerClient,
  sendRegistrationOtp,
  login,
  verifyLogin2FA,
  resendLogin2FA,
  updateProfile,
  requestEmailChange,
  confirmEmailChange,
  deleteAccount,
  generateToken,
  requestPasswordReset,
  resetPassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
};
