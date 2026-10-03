const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const authService = require("../services/authService");
const { logAction } = require("../services/auditService");

const sendRegisterOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { fullName, email } = req.body;
  const result = await authService.sendRegistrationOtp({ fullName, email });

  await logAction({
    req,
    userEmail: email,
    userRole: "client",
    action: "REGISTRATION_OTP_DISPATCHED",
    entityType: "auth",
    entityLabel: email,
    details: { method: "registration_email_otp" },
  });

  res.status(200).json(result);
});

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { fullName, email, password, otp } = req.body;
  const result = await authService.registerClient({
    fullName,
    email,
    password,
    otp,
  });

  await logAction({
    req,
    userId: result.user?.id,
    userName: result.user?.fullName,
    userEmail: result.user?.email,
    userRole: result.user?.role || "client",
    action: "USER_REGISTER",
    entityType: "auth",
    entityId: result.user?.id,
    entityLabel: result.user?.email,
    details: { method: "client_registration_otp_verified" },
  });

  res.status(201).json(result);
});

const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  if (result.userId) {
    await logAction({
      req,
      userId: result.userId,
      userName: result.userName,
      userEmail: result.userEmail,
      userRole: result.userRole || "client",
      action: "LOGIN_2FA_DISPATCHED",
      entityType: "auth",
      entityId: result.userId,
      entityLabel: result.userEmail,
      details: { role: result.userRole, method: "email_2fa_otp" },
    });
  }

  res.status(200).json(result);
});

const verifyLogin2FA = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email, otp } = req.body;
  const result = await authService.verifyLogin2FA({ email, otp });

  await logAction({
    req,
    userId: result.user?.id,
    userName: result.user?.fullName,
    userEmail: result.user?.email,
    userRole: result.user?.role || "client",
    action: "USER_LOGIN_2FA_VERIFIED",
    entityType: "auth",
    entityId: result.user?.id,
    entityLabel: result.user?.email,
    details: { role: result.user?.role, method: "email_2fa_otp" },
  });

  res.status(200).json(result);
});

const resendLogin2FA = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email } = req.body;
  const result = await authService.resendLogin2FA(email);

  res.status(200).json(result);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email, contactNumber, currentPassword, newPassword } =
    req.body;
  const updatedUser = await authService.updateProfile(req.user._id, {
    fullName,
    email,
    contactNumber,
    currentPassword,
    newPassword,
  });

  await logAction({
    req,
    userId: updatedUser.id,
    userName: updatedUser.fullName,
    userEmail: updatedUser.email,
    userRole: updatedUser.role,
    action: "USER_PROFILE_UPDATE",
    entityType: "user",
    entityId: updatedUser.id,
    entityLabel: updatedUser.email,
    details: {
      passwordChanged: Boolean(newPassword),
    },
  });

  res.status(200).json({ user: updatedUser });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email } = req.body;
  const result = await authService.requestPasswordReset(email);

  if (result.userId) {
    await logAction({
      req,
      userId: result.userId,
      userName: result.userName,
      userEmail: result.userEmail,
      userRole: result.userRole,
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "auth",
      entityId: result.userId,
      entityLabel: result.userEmail,
      details: { method: "email_token_link" },
    });
  }

  res.status(200).json({
    message: result.message,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { token, password } = req.body;
  const result = await authService.resetPassword({
    token,
    newPassword: password,
  });

  await logAction({
    req,
    userId: result.userId,
    userName: result.userName,
    userEmail: result.userEmail,
    userRole: result.userRole,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "auth",
    entityId: result.userId,
    entityLabel: result.userEmail,
    details: { method: "token_verification" },
  });

  res.status(200).json({ message: result.message });
});

const sendOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email } = req.body;
  const result = await authService.sendPasswordResetOtp(email);

  if (result.userId) {
    await logAction({
      req,
      userId: result.userId,
      userName: result.userName,
      userEmail: result.userEmail,
      userRole: result.userRole,
      action: "OTP_VERIFICATION_DISPATCHED",
      entityType: "auth",
      entityId: result.userId,
      entityLabel: result.userEmail,
      details: { method: "email_otp_code" },
    });
  }

  res.status(200).json({
    message: result.message,
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email, otp } = req.body;
  const result = await authService.verifyPasswordResetOtp({ email, otp });

  await logAction({
    req,
    userId: result.userId,
    userName: result.userName,
    userEmail: result.userEmail,
    userRole: result.userRole,
    action: "OTP_VERIFICATION_SUCCESSFUL",
    entityType: "auth",
    entityId: result.userId,
    entityLabel: result.userEmail,
    details: { method: "email_otp_verified" },
  });

  res.status(200).json({
    message: result.message,
    resetToken: result.resetToken,
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  if (req.user.role !== "client") {
    res.status(403);
    throw new Error("Only client accounts can be self-deleted.");
  }

  await authService.deleteAccount(req.user._id);

  await logAction({
    req,
    userId: req.user._id,
    userName: req.user.fullName,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: "USER_ACCOUNT_DELETED",
    entityType: "auth",
    entityId: req.user._id,
    entityLabel: req.user.email,
    details: { method: "client_self_deletion_erasure" },
  });

  res.status(200).json({ message: "Account permanently deleted." });
});

module.exports = {
  register,
  sendRegisterOtp,
  login,
  verifyLogin2FA,
  resendLogin2FA,
  updateProfile,
  deleteAccount,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
};
