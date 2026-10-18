const mongoose = require("mongoose");
const Counter = require("./Counter");
const { allocateContractRequestNumber } = require("../utils/requestNumbers");

const { Schema } = mongoose;

const contractSchema = new Schema(
  {
    requestNumber: {
      type: String,
      unique: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    contractType: {
      type: String,
      enum: [
        "regular",
        "probationary",
        "project_based",
        "fixed_term",
        "employment",
      ],
      default: "regular",
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryDeliveryType: { type: String, enum: ["upload", "authenticated"], default: "upload" },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "png", "jpeg", "jpg"],
    },
    rawOcrText: {
      type: String,
      default: "",
    },
    piiSanitized: {
      type: Boolean,
      default: false,
    },
    piiRedactionCount: {
      type: Number,
      default: 0,
    },
    processingToken: { type: String, default: null, select: false },
    processingLeaseUntil: { type: Date, default: null, select: false },
    processingAttempts: { type: Number, default: 0, select: false },
    processingNextAttemptAt: { type: Date, default: null, select: false },
    ocrConfidence: {
      type: Number,
      default: null,
    },
    ocrMethod: {
      type: String,
      enum: ["direct", "tesseract", "cloud", "manual", null],
      default: null,
    },
    flaggedForManualReview: {
      type: Boolean,
      default: false,
    },
    // OCR Processing → AI Analysis → Awaiting Attorney Review → Under Review → Completed
    status: {
      type: String,
      enum: [
        "pending",
        "ocr_processing",
        "ai_analysis",
        "awaiting_attorney_review",
        "under_review",
        "completed",
        "rejected",
      ],
      default: "pending",
    },
    aiRiskLevel: {
      type: String,
      enum: ["low", "medium", "high", null],
      default: null,
    },
    assessmentState: { type: String, enum: ["assessed", "insufficient_evidence"] },
    insufficientEvidenceCount: { type: Number, min: 0 },
    attorneyRiskOverride: {
      type: String,
      enum: ["low", "medium", "high", null],
      default: null,
    },
    assignedAttorneyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewCompletedAt: {
      type: Date,
      default: null,
    },
    attorneyNotes: {
      type: String,
      default: "",
    },
    reportReleasedToClient: {
      type: Boolean,
      default: false,
    },
    reportReleasedAt: {
      type: Date,
      default: null,
    },
    reportCloudinaryUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

contractSchema.virtual("finalRiskLevel").get(function () {
  return this.attorneyRiskOverride ?? this.aiRiskLevel;
});

// High-impact indexes for dashboard & queue queries (DAT-02)
contractSchema.index({ clientId: 1, createdAt: -1 });
contractSchema.index({ clientId: 1, status: 1 });
contractSchema.index({ status: 1, createdAt: -1 });
contractSchema.index({ assignedAttorneyId: 1, status: 1 });

contractSchema.index({ status: 1, processingNextAttemptAt: 1, processingLeaseUntil: 1 });

contractSchema.pre("save", async function (next) {
  if (this.requestNumber) return next();
  try {
    this.requestNumber = await allocateContractRequestNumber(this.constructor, Counter);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Contract", contractSchema);
