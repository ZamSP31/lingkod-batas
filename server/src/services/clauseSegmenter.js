/**
 * clauseSegmenter.js
 * Segments raw contract text into structured, indexed, and categorized clauses.
 * Supports standard Philippine employment contracts and common legal formatting conventions.
 */

// Category detection patterns based on Philippine Labor Law terminology
const CATEGORY_PATTERNS = {
  wage_and_hours: [
    /\b(wage|salary|compensation|deduct\w*|overtime|premium|night\s+shift|holiday\s+pay|13th\s+month|bonus|allowance|deposit\w*|cash\s+bond|withhold\w*|payroll|hours?\s+of\s+work|meal\s+break|rest\s+day)\b/i,
  ],
  termination: [
    /\b(terminat\w*|dismiss\w*|severance|notice\s+period|just\s+cause|authorized\s+cause|redundancy|retrench\w*|probation\w*|security\s+of\s+tenure|resignation|two-notice|due\s+process|misconduct|neglect)\b/i,
  ],
  non_compete: [
    /\b(non-compete\w*|non\s+compete\w*|compet\w*|covenant\s+not\s+to\s+compete|restraint\s+of\s+trade|restrictive\s+covenant\w*|non-solicit\w*|non\s+solicit\w*|exclusiv\w*|post-employment\w*)\b/i,
  ],
  confidentiality: [
    /\b(confidential\w*|trade\s+secret|proprietary|non-disclosure|nda|privacy|sensitive\s+information|non-disparagement)\b/i,
  ],
  liability_waiver: [
    /\b(indemnif\w*|hold\s+harmless|waiv\w*|liability|damages|release\s+of\s+claims|injur\w*|accident|death|fault|negligence)\b/i,
  ],
  intellectual_property: [
    /\b(intellectual\s+property|invent\w*|copyright|patent\w*|work\s+made\s+for\s+hire|assignment\s+of\s+inventions|author|creator|trademark)\b/i,
  ],
  jurisdiction: [
    /\b(governing\s+law|jurisdiction|venue|arbitration|dispute\s+resolution|courts?\s+of|nlrc|labor\s+arbiter|choice\s+of\s+law)\b/i,
  ],
  contracting_and_subcontracting: [
    /\b(independent\s+contractor|subcontract\w*|principal|labor-only|service\s+agreement|third-party|job\s+contracting)\b/i,
  ],
};

/**
 * Infers the primary risk category for a clause text based on keyword density.
 * @param {string} text
 * @returns {string} One of the StatutorySource tag enums
 */
function detectCategory(text) {
  let bestCategory = 'other';
  let highestMatches = 0;

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    let matches = 0;
    for (const pattern of patterns) {
      const matchArray = text.match(new RegExp(pattern, 'gi'));
      if (matchArray) {
        matches += matchArray.length;
      }
    }
    if (matches > highestMatches) {
      highestMatches = matches;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/**
 * Extracts all applicable category tags for a clause.
 * @param {string} text
 * @returns {string[]}
 */
function detectAllCategories(text) {
  const categories = [];

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        categories.push(category);
        break;
      }
    }
  }

  return categories.length > 0 ? categories : ['other'];
}

/**
 * Segments raw contract text into an array of structured clauses.
 * @param {string} rawText
 * @returns {Array<{
 *   clauseIndex: number,
 *   title: string,
 *   clauseText: string,
 *   category: string,
 *   allCategories: string[]
 * }>}
 */
function segmentContractText(rawText) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return [];
  }

  // Normalize line breaks and remove excessive carriage returns
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Primary boundary regex matching standard contract headers:
  // - "Section 1", "Section 1.1", "Sec. 1"
  // - "Article I", "Article 1"
  // - "Clause 1", "Clause 1.1"
  // - Numbered headings: "1. ", "2. ", "1.1 ", "I. ", "II. ", etc.
  const sectionSplitter = /(?=(?:\n\s*(?:Section|Article|Clause|SEC\.|ART\.)\s+[0-9IVXLCDM]+(?:\.[0-9]+)*|\n\s*(?:[0-9]+|[IVXLCDM]+)\.\s+[A-Z]|\n\s*\([0-9a-zA-Z]+\)\s+[A-Z]))/i;

  let rawChunks = normalized.split(sectionSplitter);

  // If section splitter did not find multiple sections, split by double newlines (paragraphs)
  if (rawChunks.length <= 1) {
    rawChunks = normalized.split(/\n\s*\n+/);
  }

  const clauses = [];
  let index = 0;

  for (let chunk of rawChunks) {
    chunk = chunk.trim();
    // Skip negligible chunks (e.g. page numbers, standalone footer dates)
    if (chunk.length < 25) {
      continue;
    }

    // Extract title from the first line or first 60 characters
    const firstLineBreak = chunk.indexOf('\n');
    let titleCandidate = '';
    if (firstLineBreak > 0 && firstLineBreak <= 80) {
      titleCandidate = chunk.substring(0, firstLineBreak).trim();
    } else {
      titleCandidate = chunk.substring(0, 60).trim();
      if (chunk.length > 60) titleCandidate += '...';
    }

    const allCategories = detectAllCategories(chunk);
    const category = detectCategory(chunk);

    clauses.push({
      clauseIndex: index++,
      title: titleCandidate || `Clause ${index}`,
      clauseText: chunk,
      category,
      allCategories,
    });
  }

  // Fallback: If still empty (e.g. extremely short text), return entire text as Clause 0
  if (clauses.length === 0 && normalized.length > 0) {
    clauses.push({
      clauseIndex: 0,
      title: 'General Terms & Conditions',
      clauseText: normalized,
      category: detectCategory(normalized),
      allCategories: detectAllCategories(normalized),
    });
  }

  return clauses;
}

module.exports = {
  segmentContractText,
  detectCategory,
  detectAllCategories,
  CATEGORY_PATTERNS,
};
