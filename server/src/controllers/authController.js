const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { fullName, email, password } = req.body;
  const result = await authService.registerClient({ fullName, email, password });
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
  res.status(200).json(result);
});

module.exports = { register, login };
