const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ["client", "attorney", "admin"],
      required: true,
      default: "client", // only clients self-register; attorneys are admin-created
    },
    // Attorney-only field, optional for other roles
    rollNumber: {
      type: String,
      trim: true,
    },

    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      inAppNotifications: {
        type: Boolean,
        default: true,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    resetPasswordOtp: {
      type: String,
      select: false,
    },
    resetPasswordOtpExpires: {
      type: Date,
      select: false,
    },
    twoFactorOtp: {
      type: String,
      select: false,
    },
    twoFactorOtpExpires: {
      type: Date,
      select: false,
    },
    twoFactorOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    resetPasswordOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords on login
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
