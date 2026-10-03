/**
 * securityUtils.js
 * Cryptographic and input sanitization utilities for Lingkod Batas.
 */

/**
 * Escapes regex metacharacters in user query strings to prevent ReDoS (CWE-1333).
 * @param {string} str - Raw user input
 * @returns {string} Regex-escaped string
 */
function escapeRegex(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitizes spreadsheet formula characters to prevent CSV Injection (CWE-1236).
 * Prepend a single quote (') if the string begins with =, +, -, @, tab, or carriage return.
 * @param {any} val
 * @returns {string} Safe CSV string
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Escapes HTML entity characters to prevent HTML/XSS injection in emails (CWE-79).
 * @param {string} str
 * @returns {string} HTML-escaped string
 */
function escapeHtml(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

module.exports = {
  escapeRegex,
  sanitizeCsvCell,
  escapeHtml,
};
