const mongoose = require('mongoose');

const { Schema } = mongoose;

const contractFlagSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    clauseText: {
      type: String,
      required: true,
    },
    clauseIndex: {
      type: Number,
      required: true,
    },
    aiRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    aiRationale: {
      type: String,
      required: true,
    },
    // Array because a clause may span multiple provisions (panel feedback #3)
    statutoryBases: [
      {
        sourceId: {
          type: Schema.Types.ObjectId,
          ref: 'StatutorySource',
        },
        citation: {
          type: String,
          required: true,
        },
        excerpt: {
          type: String,
        },
      },
    ],
    // A clause may fall into more than one category
    riskCategories: [
      {
        type: String,
        enum: [
          'wage_and_hours',
          'termination',
          'non_compete',
          'confidentiality',
          'liability_waiver',
          'intellectual_property',
          'jurisdiction',
          'other',
        ],
      },
    ],
    attorneyStatus: {
      type: String,
      enum: ['pending', 'approved', 'overridden', 'dismissed'],
      default: 'pending',
    },
    attorneyRiskOverride: {
      type: String,
      enum: ['low', 'medium', 'high', null],
      default: null,
    },
    attorneyNote: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    includedInReport: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

contractFlagSchema.virtual('finalRiskLevel').get(function () {
  return this.attorneyRiskOverride ?? this.aiRiskLevel;
});

contractFlagSchema.index({ contractId: 1, clauseIndex: 1 });

module.exports = mongoose.model('ContractFlag', contractFlagSchema);
