// Keep aligned with client/src/utils/consent.ts and the archived notice.
const CONSENT_VERSION = "2026-10-31";

function recordConsent(body) {
  const consentAccepted = body?.consentAccepted;
  const consentVersion = body?.consentVersion;
  if (![true, "true"].includes(consentAccepted) || consentVersion !== CONSENT_VERSION) {
    const error = new Error("Accept the current terms and privacy notice before continuing. Refresh the page if the notice has changed.");
    error.statusCode = 400;
    throw error;
  }
  // The server supplies the acceptance timestamp, never a caller-provided date.
  return { consentVersion: CONSENT_VERSION, consentAcceptedAt: new Date() };
}

module.exports = { CONSENT_VERSION, recordConsent };
