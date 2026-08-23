const mongoose = require('mongoose');

const { Schema } = mongoose;

const statutorySourceSchema = new Schema(
  {
    citation: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ['labor_code', 'dole_department_order', 'dole_advisory', 'republic_act', 'other'],
      required: true,
    },
    provisionNumber: {
      type: String,
      default: '',
    },
    provisionText: {
      type: String,
      required: true,
    },
    issuanceDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
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
          'contracting_and_subcontracting',
          'other',
        ],
      },
    ],
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

statutorySourceSchema.index(
  { citation: 'text', title: 'text', provisionText: 'text' },
  { name: 'statutory_text_search' }
);

module.exports = mongoose.model('StatutorySource', statutorySourceSchema);
