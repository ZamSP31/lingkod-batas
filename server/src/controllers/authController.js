const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const authService = require("../services/authService");
const { logAction } = require("../services/auditService");

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { fullName, email, password } = req.body;
  const result = await authService.registerClient({
    fullName,
    email,
    password,
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
    details: { method: "client_registration" },
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

  await logAction({
    req,
    userId: result.user?.id,
    userName: result.user?.fullName,
    userEmail: result.user?.email,
    userRole: result.user?.role || "client",
    action: "USER_LOGIN",
    entityType: "auth",
    entityId: result.user?.id,
    entityLabel: result.user?.email,
    details: { role: result.user?.role },
  });

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
    resetToken: result.resetToken,
    resetUrl: result.resetUrl,
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

module.exports = {
  register,
  login,
  updateProfile,
  forgotPassword,
  resetPassword,
};
