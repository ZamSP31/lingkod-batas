const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register-otp',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
  ],
  sendRegisterOtp
);

router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be exactly 6 digits.'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

router.post(
  '/login-verify-otp',
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be exactly 6 digits.'),
  ],
  verifyLogin2FA
);

router.post(
  '/login-resend-otp',
  [body('email').isEmail().withMessage('A valid email is required.')],
  resendLogin2FA
);

router.post(
  '/send-otp',
  [body('email').isEmail().withMessage('A valid email address is required.')],
  sendOtp
);

router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('A valid email address is required.'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be exactly 6 digits.'),
  ],
  verifyOtp
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('A valid email address is required.')],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.'),
  ],
  resetPassword
);

router.put('/profile', protect, updateProfile);
router.delete('/account', protect, deleteAccount);

module.exports = router;
