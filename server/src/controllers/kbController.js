const asyncHandler = require('express-async-handler');
const StatutorySource = require('../models/StatutorySource');

/**
 * @desc    Get all statutory sources with full-text search, filtering, and pagination
 * @route   GET /api/knowledge-base
 * @access  Private
 */
const getSources = asyncHandler(async (req, res) => {
  const {
    q,
    sourceType,
    tag,
    page = 1,
    limit = 20,
    activeOnly = 'true',
  } = req.query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const filter = {};

  if (activeOnly === 'true') {
    filter.isActive = true;
  }

  if (sourceType) {
    filter.sourceType = sourceType;
  }

  if (tag) {
    filter.tags = tag;
  }

  if (q && q.trim()) {
    const searchTerm = q.trim();
    filter.$or = [
      { citation: { $regex: searchTerm, $options: 'i' } },
      { title: { $regex: searchTerm, $options: 'i' } },
      { provisionText: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const total = await StatutorySource.countDocuments(filter);
  const sources = await StatutorySource.find(filter)
    .sort({ updatedAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .populate('addedBy', 'fullName email')
    .populate('lastUpdatedBy', 'fullName email');

  res.status(200).json({
    sources,
    total,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
  });
});

/**
 * @desc    Get single statutory source by ID
 * @route   GET /api/knowledge-base/:id
 * @access  Private
 */
const getSourceById = asyncHandler(async (req, res) => {
  const source = await StatutorySource.findById(req.params.id)
    .populate('addedBy', 'fullName email')
    .populate('lastUpdatedBy', 'fullName email');

  if (!source) {
    res.status(404);
    throw new Error('Statutory source not found.');
  }

  res.status(200).json({ source });
});

/**
 * @desc    Create a new statutory source provision
 * @route   POST /api/knowledge-base
 * @access  Private (Attorney / Admin)
 */
const createSource = asyncHandler(async (req, res) => {
  const {
    citation,
    title,
    sourceType,
    provisionNumber,
    provisionText,
    tags,
    issuanceDate,
  } = req.body;

  if (!citation || !title || !sourceType || !provisionText) {
    res.status(400);
    throw new Error('Citation, title, sourceType, and provisionText are required.');
  }

  const existing = await StatutorySource.findOne({ citation: citation.trim() });
  if (existing) {
    res.status(409);
    throw new Error('A statutory source with this citation already exists.');
  }

  const source = await StatutorySource.create({
    citation: citation.trim(),
    title: title.trim(),
    sourceType,
    provisionNumber: provisionNumber ? provisionNumber.trim() : '',
    provisionText: provisionText.trim(),
    tags: Array.isArray(tags) ? tags : [],
    issuanceDate: issuanceDate ? new Date(issuanceDate) : null,
    addedBy: req.user._id,
  });

  res.status(201).json({
    message: 'Statutory source created successfully.',
    source,
  });
});

/**
 * @desc    Update a statutory source provision
 * @route   PATCH /api/knowledge-base/:id
 * @access  Private (Attorney / Admin)
 */
const updateSource = asyncHandler(async (req, res) => {
  const source = await StatutorySource.findById(req.params.id);

  if (!source) {
    res.status(404);
    throw new Error('Statutory source not found.');
  }

  const {
    citation,
    title,
    sourceType,
    provisionNumber,
    provisionText,
    tags,
    issuanceDate,
    isActive,
  } = req.body;

  if (citation && citation.trim() !== source.citation) {
    const existing = await StatutorySource.findOne({
      citation: citation.trim(),
      _id: { $ne: source._id },
    });
    if (existing) {
      res.status(409);
      throw new Error('Another statutory source already uses this citation.');
    }
    source.citation = citation.trim();
  }

  if (title) source.title = title.trim();
  if (sourceType) source.sourceType = sourceType;
  if (provisionNumber !== undefined) source.provisionNumber = provisionNumber.trim();
  if (provisionText) source.provisionText = provisionText.trim();
  if (Array.isArray(tags)) source.tags = tags;
  if (issuanceDate !== undefined) {
    source.issuanceDate = issuanceDate ? new Date(issuanceDate) : null;
  }
  if (isActive !== undefined) source.isActive = Boolean(isActive);

  source.lastUpdatedBy = req.user._id;

  const updatedSource = await source.save();

  res.status(200).json({
    message: 'Statutory source updated successfully.',
    source: updatedSource,
  });
});

/**
 * @desc    Delete (soft-delete or deactivate) a statutory source provision
 * @route   DELETE /api/knowledge-base/:id
 * @access  Private (Attorney / Admin)
 */
const deleteSource = asyncHandler(async (req, res) => {
  const source = await StatutorySource.findById(req.params.id);

  if (!source) {
    res.status(404);
    throw new Error('Statutory source not found.');
  }

  source.isActive = false;
  source.lastUpdatedBy = req.user._id;
  await source.save();

  res.status(200).json({
    message: 'Statutory source deactivated successfully.',
    sourceId: source._id,
  });
});

module.exports = {
  getSources,
  getSourceById,
  createSource,
  updateSource,
  deleteSource,
};
