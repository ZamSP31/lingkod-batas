const mongoose = require("mongoose");

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userName: {
      type: String,
      default: "System",
      trim: true,
    },
    userEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    userRole: {
      type: String,
      enum: ["client", "attorney", "admin", "system"],
      default: "system",
    },
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        "USER_LOGIN",
        "USER_REGISTER",
        "CONTRACT_SUBMITTED",
        "OCR_PROCESSED",
        "AI_ANALYSIS_COMPLETED",
        "CONTRACT_ASSIGNED",
        "FLAG_REVIEWED",
        "FLAG_OVERRIDDEN",
        "REVIEW_COMPLETED",
        "REPORT_VIEWED",
        "REPORT_DOWNLOADED",
        "STATUTORY_SOURCE_CREATED",
        "STATUTORY_SOURCE_UPDATED",
        "STATUTORY_SOURCE_DELETED",
      ],
    },
    entityType: {
      type: String,
      enum: [
        "contract",
        "clause_flag",
        "statutory_source",
        "user",
        "auth",
        "system",
      ],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: null,
      index: true,
    },
    entityLabel: {
      type: String,
      default: null,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  },
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
