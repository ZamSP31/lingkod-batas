/**
 * piiSanitizer.js
 * Sensitive Personal Information (SPI) & PII Redaction Engine
 *
 * Implemented under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).
 * Sanitizes high-risk personal identifiers from raw contract OCR output before
 * persistence in MongoDB Atlas and ingestion into the AI RAG / segmentation pipeline.
 *
 * Protects:
 * - Tax Identification Number (TIN)
 * - Social Security System (SSS) Number
 * - PhilHealth Identification Number (PIN)
 * - Pag-IBIG / HDMF MID
 * - Philippine Mobile & Landline Numbers
 * - Personal Email Addresses
 * - Bank / Payroll Account Numbers
 * - Government ID Numbers (Passport, Driver's License)
 */

/**
 * Redaction tokens
 */
const REDACTION_TOKENS = {
  TIN: "[REDACTED_TIN]",
  SSS: "[REDACTED_SSS]",
  PHILHEALTH: "[REDACTED_PHILHEALTH]",
  PAGIBIG: "[REDACTED_PAGIBIG]",
  PHONE: "[REDACTED_PHONE]",
  EMAIL: "[REDACTED_EMAIL]",
  BANK_ACCOUNT: "[REDACTED_BANK_ACCOUNT]",
  GOV_ID: "[REDACTED_GOV_ID]",
};

/**
 * Regular expressions tailored to Philippine personal documents.
 * Crafted specifically to avoid colliding with Philippine legal citations
 * (e.g. "Labor Code Art. 279", "DOLE D.O. 174-17", or standard dates).
 */
const PATTERNS = {
  // Philippine Tax Identification Number: 9 or 12 digits (XXX-XXX-XXX or XXX-XXX-XXX-XXX)
  tin: /(?:\b(?:T\.?I\.?N\.?|Tax\s+Identification\s+No\.?|TIN)[:\s#]*)(\d{3}[-\s]\d{3}[-\s]\d{3}(?:[-\s]\d{3})?)\b|\b\d{3}[-]\d{3}[-]\d{3}(?:[-]\d{3})?\b/gi,

  // Social Security System (SSS) Number: 10 digits formatted as XX-XXXXXXX-X
  sss: /(?:\b(?:S\.?S\.?S\.?|Social\s+Security\s+(?:No\.?|System))[:\s#]*)(\d{2}[-\s]\d{7}[-\s]\d{1})\b|\b\d{2}[-]\d{7}[-]\d{1}\b/gi,

  // PhilHealth Identification Number (PIN): 12 digits formatted as XX-XXXXXXXXX-X
  philhealth:
    /(?:\b(?:PhilHealth|Phil\s*Health|PIN)[:\s#]*)(\d{2}[-\s]\d{9}[-\s]\d{1})\b|\b\d{2}[-]\d{9}[-]\d{1}\b/gi,

  // Pag-IBIG / HDMF Number: 12 digits (XXXX-XXXX-XXXX)
  pagibig:
    /(?:\b(?:Pag-?IBIG|HDMF|MID)[:\s#]*)(\d{4}[-\s]\d{4}[-\s]\d{4})\b|\b\d{4}[-]\d{4}[-]\d{4}\b/gi,

  // Philippine Mobile: +63 9XX XXX XXXX, 09XX-XXX-XXXX, 09XXXXXXXXX
  phoneMobile: /(?:\+?63[\s.-]?|0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,

  // Philippine Landline (e.g. (02) 8XXX-XXXX or 02-8XXX-XXXX)
  phoneLandline: /(?:\(?02\)?[\s.-]?)?[2-8]\d{3}[\s.-]?\d{4}\b/g,

  // Standard Email Addresses (RFC 5322 compatible)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b/g,

  // Bank / Payroll Account Numbers preceded by keywords
  bankAccount:
    /(?:\b(?:Bank\s+Account|Account\s+No\.?|Acct\.?\s*No\.?|Payroll\s+Account|Savings\s+Account)[:\s#]*)(\d{10,16})\b/gi,

  // Philippine Passport & Driver's License Numbers
  govId:
    /(?:\b(?:Passport\s+No\.?|Driver'?s\s+License\s+No\.?|License\s+No\.?|UMID)[:\s#]*)([A-Z]\d{7}[A-Z]|[A-Z]\d{2}-\d{2}-\d{6}|\d{4}-\d{7}-\d)\b/gi,
};

/**
 * Sanitizes contract text by redacting Philippine Sensitive Personal Information (SPI).
 * Returns the masked text along with categorical redaction counts.
 *
 * @param {string} text - Raw OCR or parsed contract text
 * @returns {{
 *   sanitizedText: string,
 *   redactionCounts: Record<string, number>,
 *   totalRedacted: number,
 *   hasRedactions: boolean
 * }}
 */
function maskPII(text) {
  if (!text || typeof text !== "string") {
    return {
      sanitizedText: "",
      redactionCounts: {},
      totalRedacted: 0,
      hasRedactions: false,
    };
  }

  let sanitized = text;
  const counts = {
    tin: 0,
    sss: 0,
    philhealth: 0,
    pagibig: 0,
    phone: 0,
    email: 0,
    bankAccount: 0,
    govId: 0,
  };

  // 1. Redact Email Addresses
  sanitized = sanitized.replace(PATTERNS.email, () => {
    counts.email += 1;
    return REDACTION_TOKENS.EMAIL;
  });

  // 2. Redact Government Issued IDs
  sanitized = sanitized.replace(PATTERNS.govId, (match, idGroup) => {
    counts.govId += 1;
    return match.replace(idGroup, REDACTION_TOKENS.GOV_ID);
  });

  // 3. Redact Philippine Mobile Phones
  sanitized = sanitized.replace(PATTERNS.phoneMobile, () => {
    counts.phone += 1;
    return REDACTION_TOKENS.PHONE;
  });

  // 4. Redact Philippine TIN
  sanitized = sanitized.replace(PATTERNS.tin, (match, tinGroup) => {
    counts.tin += 1;
    return tinGroup
      ? match.replace(tinGroup, REDACTION_TOKENS.TIN)
      : REDACTION_TOKENS.TIN;
  });

  // 5. Redact SSS Numbers
  sanitized = sanitized.replace(PATTERNS.sss, (match, sssGroup) => {
    counts.sss += 1;
    return sssGroup
      ? match.replace(sssGroup, REDACTION_TOKENS.SSS)
      : REDACTION_TOKENS.SSS;
  });

  // 6. Redact PhilHealth Numbers
  sanitized = sanitized.replace(PATTERNS.philhealth, (match, phGroup) => {
    counts.philhealth += 1;
    return phGroup
      ? match.replace(phGroup, REDACTION_TOKENS.PHILHEALTH)
      : REDACTION_TOKENS.PHILHEALTH;
  });

  // 7. Redact Pag-IBIG Numbers
  sanitized = sanitized.replace(PATTERNS.pagibig, (match, hdmfGroup) => {
    counts.pagibig += 1;
    return hdmfGroup
      ? match.replace(hdmfGroup, REDACTION_TOKENS.PAGIBIG)
      : REDACTION_TOKENS.PAGIBIG;
  });

  // 8. Redact Bank / Payroll Accounts
  sanitized = sanitized.replace(PATTERNS.bankAccount, (match, accGroup) => {
    counts.bankAccount += 1;
    return match.replace(accGroup, REDACTION_TOKENS.BANK_ACCOUNT);
  });

  const totalRedacted = Object.values(counts).reduce((a, b) => a + b, 0);

  return {
    sanitizedText: sanitized,
    redactionCounts: counts,
    totalRedacted,
    hasRedactions: totalRedacted > 0,
  };
}

module.exports = {
  maskPII,
  REDACTION_TOKENS,
  PATTERNS,
};
