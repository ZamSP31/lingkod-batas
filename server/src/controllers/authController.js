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

module.exports = { register, login };
