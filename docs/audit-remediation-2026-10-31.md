# Audit remediation: 31 October 2026

This is a local implementation and verification report. No live database,
Cloudinary, email, deployment, commit, or push was performed. The initial
working tree was clean. Changes were implemented in batches with targeted
regression checks, followed by full checks.

## Finding disposition

| Finding | Disposition | Result and principal source |
| --- | --- | --- |
| F01 | Fixed locally | `server/src/services/clauseSegmenter.js` preserves every non-empty segment, including short obligations, in order. Existing stored assessments were not regenerated. |
| F02 | Conservatively mitigated | `server/src/services/ragService.js` no longer classifies family-status mentions as high risk. Protective, restrictive, and mixed wording requires documented manual assessment. A contextual automated legal rule still requires domain review. |
| F03 | Implemented locally | Assigned attorneys can save a complete transcription into a zero-clause active review using PATCH `/api/attorney/contracts/:id/transcription`. Parent locking prevents concurrent saves or replacement of existing findings. All resulting clauses are unassessed; completion requires manual decisions and rationales. The review page includes original-document confirmation and recoverable save errors. |
| F04 | Implemented locally | `authService.js` disables the account and revokes sessions before cleanup. Storage deletion must be confirmed. Failed cleanup leaves disabled, retryable records for `accountLifecycle.js`; response 202 explicitly reports pending deletion. Database erasure uses one transaction. `submissionPersistence.js` locks the active owner and saves the contract in one transaction, preventing inserts after deactivation. Audit records are retained separately. |
| F05 | Partially resolved | Lockfile updates within existing dependency constraints removed all backend critical/high findings and all frontend findings. Backend production audit is zero. Ten moderate findings remain in backend development tooling; major tooling migration was not forced. |
| F06 | Fixed locally | New passwords share the existing 8–50 character/complexity rules plus a 72-byte UTF-8 bound on client and server. Login accepts safe legacy lengths but rejects input beyond bcrypt's byte boundary. Existing passwords exceeding that boundary require password recovery. No credential migration was performed. |
| F07 | Fixed locally | Statutory deactivation preserves the archived attachment and supports reactivation. |
| F08 | Fixed locally | Statutory deletion uses `raw` for PDF/TXT and `image` for images, requires confirmed storage removal, and retains the source reference on failure. |
| F09 | Fixed locally | `server/scripts/test-atomic-counter.js` now runs the existing isolated request-number tests. It does not load `.env`, connect to Atlas, select a real client, create live contracts, or reset a counter. |
| F10 | Implemented locally | New attorney uploads are reserved to the uploader, visible during processing, and claimable for review by that attorney when ready. Processing rows cannot open review. Reserved notifications do not broadcast to other attorneys. Client uploads keep the shared ready queue. Existing records were not reassigned. |
| F11 | Partially resolved | Landline masking is applied with an area-code requirement; party masking requires a label to avoid erasing obligations. Privacy notices explain heuristic limitations and actual retention. Complete anonymization is not claimed or established. |
| F12 | Fixed locally | Reset-link requests now send a real email through the configured transporter; delivery failure rejects instead of claiming dispatch. Tests mock the transporter. |
| F13 | Fixed locally | OTPs/reset links are not logged as delivery fallbacks in any runtime. Mail errors are sanitized. Development authentication therefore requires a working mail transporter or a mocked test mailer. |
| F14 | Fixed locally | Audit IP attribution uses Express `req.ip`, governed by configured proxy trust, rather than trusting raw forwarded headers. Live proxy topology remains unverified. |
| F15 | Fixed locally | Both dashboards expose load errors and retry, preserve previously loaded data, and do not render a successful empty contract table after a failed initial load. |
| F16 | Implemented locally | New registrations and submissions require explicit acceptance of notice version `2026-10-31`. Optional `consentVersion` and server-generated `consentAcceptedAt` fields are persisted on User/Contract. Historical records are unchanged. See `consent-2026-10-31.md`. |

Supporting verification corrections also align emitted authentication/deletion
audit events with the audit schema/category, clear the existing three lint
findings, and connect frontend `npm test` to its existing test suite. Broad
README completion/architecture claims from F19 were not rewritten.

## Verification

- Backend: 223 tests passed; zero failed, skipped, or TODO tests.
- Frontend: 26 tests passed using `npm.cmd test`.
- Backend: `npm.cmd run lint` passed with no errors or warnings.
- Frontend: TypeScript and Vite production build passed. The build used the
  temporary public value `https://audit-backend.example.invalid`, and output
  went to the OS temporary directory. No environment file was edited.
- Backend production `npm audit --omit=dev`: zero findings.
- Frontend full `npm audit`: zero findings.
- Backend full audit after updates: ten moderate findings, zero high/critical;
  remaining packages belong to development tooling.
- `git diff --check` passed. Git reports its existing Windows line-ending
  normalization warnings; source files were not reformatted wholesale.

Backend checks used `node --test test/*.test.js`; the full run required execution
outside the sandbox because Windows process-tree teardown is restricted inside
it. No production server was launched. Tests use synthetic records and mocked
integrations; some tests start ephemeral local HTTP servers or bounded parser
children.

## Remaining verification and operational limits

- Checks ran on Node 25.4.0. The declared Node 22 runtime and Linux deployment
  image still need verification.
- Real MongoDB transaction/conflict behavior, Cloudinary deletion/download,
  email inbox delivery, browser layout/accessibility, and deployed proxy/CORS
  behavior have not been exercised.
- MongoDB transactions require a supported replica-set deployment, as does the
  existing transactional attorney-review flow. Submission and cleanup now also
  rely on that support.
- Cloudinary and MongoDB do not share a transaction. For pending deletion,
  storage may already be gone while disabled records remain for retry. Cleanup
  accepts confirmed `not found` so it can resume. Failed compensation for an
  upload that never committed still lacks a durable orphan-cleanup queue.
- No complete OCR/redaction/retrieval/classification accuracy measurement or
  legal-domain validation was performed. Broader polarity and contextual errors
  in handwritten screening rules remain possible.
- Previously saved false positives, older unassigned attorney uploads, and
  historical consent records were not modified.
- The frontend build still warns about its approximately 601 kB main bundle.
- Ten moderate backend development-tool advisories remain. Do not blindly
  accept audit suggestions that downgrade ESLint or nodemon across major versions.

## Compatibility and rollback

The schema additions are optional consent fields, a deletion-reason field, and
additional audit action enum values. No migration, backfill, or existing-record
edit was performed. Deploy the frontend/backend together when separately
authorized, because registration/uploads now require the current consent
payload. Coordinate any rollback of that enforcement on both sides.

For an authorized rollback, revert the relevant source and lockfile changes
together and reinstall from the restored lockfiles. Retained additive metadata
does not need deletion. Do not reactivate accounts with deletion in progress or
rewind counters. Existing disabled deletion records must remain eligible for
safe cleanup. Keep original documents available while reviewing transcription
and assessment changes.

Recommended next work: review these source batches, verify the supported Node
22 runtime, and perform explicitly authorized staging checks with synthetic
data. Review contextual assessment rules with the domain attorney before
expanding automatic classification.

## Changed files

- [client/src/pages/attorney/AttorneyAccountPage.tsx](../client/src/pages/attorney/AttorneyAccountPage.tsx)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [client/package-lock.json](../client/package-lock.json)
- [client/package.json](../client/package.json)
- [client/src/components/PrivacyPolicyModal.tsx](../client/src/components/PrivacyPolicyModal.tsx)
- [client/src/components/TermsModal.tsx](../client/src/components/TermsModal.tsx)
- [client/src/components/attorney/ContractsTable.tsx](../client/src/components/attorney/ContractsTable.tsx)
- [client/src/components/attorney/ManualTranscriptionForm.tsx](../client/src/components/attorney/ManualTranscriptionForm.tsx)
- [client/src/components/shared/DeleteAccountModal.tsx](../client/src/components/shared/DeleteAccountModal.tsx)
- [client/src/context/AuthContext.tsx](../client/src/context/AuthContext.tsx)
- [client/src/mocks/chatbot.ts](../client/src/mocks/chatbot.ts)
- [client/src/pages/LoginPage.tsx](../client/src/pages/LoginPage.tsx)
- [client/src/pages/RegisterPage.tsx](../client/src/pages/RegisterPage.tsx)
- [client/src/pages/attorney/AttorneyDashboardPage.tsx](../client/src/pages/attorney/AttorneyDashboardPage.tsx)
- [client/src/pages/attorney/ReviewQueuePage.tsx](../client/src/pages/attorney/ReviewQueuePage.tsx)
- [client/src/pages/attorney/UploadContractPage.tsx](../client/src/pages/attorney/UploadContractPage.tsx)
- [client/src/pages/client/ClientAccountPage.tsx](../client/src/pages/client/ClientAccountPage.tsx)
- [client/src/pages/client/ClientDashboardPage.tsx](../client/src/pages/client/ClientDashboardPage.tsx)
- [client/src/pages/client/SubmitContractPage.tsx](../client/src/pages/client/SubmitContractPage.tsx)
- [client/src/pages/client/TrackStatusPage.tsx](../client/src/pages/client/TrackStatusPage.tsx)
- [client/src/services/attorneyService.ts](../client/src/services/attorneyService.ts)
- [client/src/services/authService.ts](../client/src/services/authService.ts)
- [client/src/utils/consent.ts](../client/src/utils/consent.ts)
- [client/src/utils/validation.ts](../client/src/utils/validation.ts)
- [client/test/helpers/componentHarness.mjs](../client/test/helpers/componentHarness.mjs)
- [client/test/passwordValidation.test.mjs](../client/test/passwordValidation.test.mjs)
- [client/test/profileSync.test.mjs](../client/test/profileSync.test.mjs)
- [client/test/reviewRecovery.test.mjs](../client/test/reviewRecovery.test.mjs)
- [docs/audit-remediation-2026-10-31.md](../docs/audit-remediation-2026-10-31.md)
- [docs/consent-2026-10-31.md](../docs/consent-2026-10-31.md)
- [server/.env.example](../server/.env.example)
- [server/package-lock.json](../server/package-lock.json)
- [server/scripts/test-atomic-counter.js](../server/scripts/test-atomic-counter.js)
- [server/src/controllers/attorneyController.js](../server/src/controllers/attorneyController.js)
- [server/src/controllers/auditController.js](../server/src/controllers/auditController.js)
- [server/src/controllers/authController.js](../server/src/controllers/authController.js)
- [server/src/controllers/chatbotController.js](../server/src/controllers/chatbotController.js)
- [server/src/controllers/contractController.js](../server/src/controllers/contractController.js)
- [server/src/controllers/kbController.js](../server/src/controllers/kbController.js)
- [server/src/models/AuditLog.js](../server/src/models/AuditLog.js)
- [server/src/models/Contract.js](../server/src/models/Contract.js)
- [server/src/models/User.js](../server/src/models/User.js)
- [server/src/routes/attorneyRoutes.js](../server/src/routes/attorneyRoutes.js)
- [server/src/services/accountLifecycle.js](../server/src/services/accountLifecycle.js)
- [server/src/services/auditService.js](../server/src/services/auditService.js)
- [server/src/services/authSecurity.js](../server/src/services/authSecurity.js)
- [server/src/services/authService.js](../server/src/services/authService.js)
- [server/src/services/clauseSegmenter.js](../server/src/services/clauseSegmenter.js)
- [server/src/services/documentProcessor.js](../server/src/services/documentProcessor.js)
- [server/src/services/emailService.js](../server/src/services/emailService.js)
- [server/src/services/manualTranscription.js](../server/src/services/manualTranscription.js)
- [server/src/services/ragService.js](../server/src/services/ragService.js)
- [server/src/services/submissionPersistence.js](../server/src/services/submissionPersistence.js)
- [server/src/utils/consent.js](../server/src/utils/consent.js)
- [server/src/utils/piiSanitizer.js](../server/src/utils/piiSanitizer.js)
- [server/src/utils/requestNumbers.js](../server/src/utils/requestNumbers.js)
- [server/test/accountLifecycle.test.js](../server/test/accountLifecycle.test.js)
- [server/test/auditLogging.test.js](../server/test/auditLogging.test.js)
- [server/test/authSecurity.test.js](../server/test/authSecurity.test.js)
- [server/test/authenticationEmail.test.js](../server/test/authenticationEmail.test.js)
- [server/test/authorization.test.js](../server/test/authorization.test.js)
- [server/test/batch2Security.test.js](../server/test/batch2Security.test.js)
- [server/test/batch3Assessment.test.js](../server/test/batch3Assessment.test.js)
- [server/test/clauseSegmentation.test.js](../server/test/clauseSegmentation.test.js)
- [server/test/consent.test.js](../server/test/consent.test.js)
- [server/test/corpusManagement.test.js](../server/test/corpusManagement.test.js)
- [server/test/helpers/isolatedHarness.js](../server/test/helpers/isolatedHarness.js)
- [server/test/ingestion.test.js](../server/test/ingestion.test.js)
- [server/test/isolation.test.js](../server/test/isolation.test.js)
- [server/test/manualTranscription.test.js](../server/test/manualTranscription.test.js)
- [server/test/piiSanitizer.test.js](../server/test/piiSanitizer.test.js)
- [server/test/requestNumbers.test.js](../server/test/requestNumbers.test.js)
- [server/test/submissionPersistence.test.js](../server/test/submissionPersistence.test.js)
