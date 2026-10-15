# Lingkod Batas deployment

## Verified source configuration

This repository uses npm with separate lockfiles in `client` and `server`.
The frontend is React/TypeScript with Vite, not Next.js. The API is Express.
JWTs are stored by the frontend and sent as Authorization bearer headers;
there are no authentication cookies to configure across domains.

## Vercel frontend

| Setting | Value |
| --- | --- |
| Root directory | `client` |
| Framework preset | Vite |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 22.x |
| Environment variable | `VITE_API_URL=https://<backend>.onrender.com` |

Set `VITE_API_URL` in Project Settings > Environment Variables for Production.
Use the backend origin only: no `/api`, credentials, or path. Set it separately
for Preview if previews are needed; Render allows only the configured frontend
origin, so arbitrary preview domains are intentionally rejected.
Changes to this build-time variable require a new Vercel deployment.
`client/vercel.json` supplies the SPA rewrite for direct links and refreshes.
Only `VITE_API_URL` belongs on the frontend. All credentials belong on Render.

## Render API

Use New > Web Service, connected to this repository and your intended branch.

| Setting | Value |
| --- | --- |
| Root directory | `server` |
| Language/runtime | Docker |
| Dockerfile path | `./Dockerfile` (relative to `server`) |
| Docker build context | `.` (relative to `server`) |
| Build command | Dockerfile runs `npm ci --omit=dev`; no separate command |
| Docker command | Leave empty; Dockerfile runs `node server.js` |
| Existing npm startup command | `npm start` |
| Health check path | `/api/health` |
| Node version | 22, provided by the Docker base image |
| Host/port | `0.0.0.0`, Render-provided `PORT` |

Docker installs Linux Poppler for scanned PDF OCR. Native Node deployment alone
does not provide this guaranteed OS dependency. Windows/macOS retain the existing
pdf-poppler converter. No new npm dependencies are introduced.

In Render > service > Environment, configure:

| Variable | Value or purpose |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` (Docker default) |
| `CLIENT_URL` | Exact production Vercel origin, no trailing slash |
| `MONGO_URI` | Atlas application connection string, with database name |
| `JWT_SECRET` | Cryptographically random secret |
| `JWT_EXPIRES_IN` | Optional; default `7d` |
| `CLOUDINARY_CLOUD_NAME` | Existing Cloudinary account name |
| `CLOUDINARY_API_KEY` | Existing Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Existing Cloudinary API secret |
| `EMAIL_FROM` | Sender authorized by your email provider |

Also configure **one** existing email option:

- Custom SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`.
- Provider preset: `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`.

Render Free blocks outbound SMTP ports 25, 465 and 587. The Gmail preset therefore
cannot deliver mail there. A current provider supporting SMTP on an allowed port,
such as 2525, can use the existing custom SMTP configuration. Otherwise choosing
a paid instance or introducing an HTTPS email integration needs owner action.
No paid resources or new email services have been created. Production email
failure now rejects delivery instead of logging OTPs and simulating success;
local development retains the existing logger.

Do not copy local `PORT=5000` to Render. No `NODE_VERSION` is necessary for Docker.
`OPENAI_API_KEY` and `ANTHROPIC_API_KEY` appear in the template but are unused by
the current runtime; do not configure paid AI integrations for this deployment.

## Deployment order

1. Review these local changes and publish them to the intended Git branch yourself.
   This preparation does not create commits or push code.
2. In Atlas, use the intended capstone database and a dedicated database user.
   Allow the selected Render service's outbound IP ranges in Atlas Network Access.
   Enter the resulting `MONGO_URI` only in Render. No migrations or seeds are run.
3. Import the repository in Vercel and reserve/confirm its production domain.
   Create the Render service with that origin as `CLIENT_URL` and all backend
   settings above. Confirm email transport is usable on your chosen instance.
4. Deploy Render, verify `https://<backend>.onrender.com/api/health` returns 200
   with `status: ok`. Startup waits for MongoDB before opening the HTTP listener.
5. Set that Render origin as Vercel's `VITE_API_URL`, then deploy Vercel.
6. If the final Vercel domain changed, update Render `CLIENT_URL` and choose
   Save and deploy. This also updates password-reset links. If the backend domain
   changed, update Vercel `VITE_API_URL` and rebuild/redeploy Vercel.
7. Complete the smoke tests below before claiming deployment succeeded.

## Processing and verification limits

Uploads use memory buffers (contract upload limit: 20 MB) and Cloudinary storage;
MongoDB stores metadata and analysis. OCR uses temporary files, not durable local
contract storage. Tesseract downloads/caches English language data and needs
outbound access. OCR/analysis executes inside the web process, while MongoDB-backed
leases and persisted stages allow interrupted jobs to recover after restart.
Free instances also sleep after inactivity; recovery requires a running server,
and CPU/memory limits require testing with synthetic multi-page documents.

`ragService.js` currently uses MongoDB retrieval and rule-based assessment;
external LLMs, Chroma and cloud OCR are not verified working features. Cloud OCR
is explicitly a stub. Hosting does not complete those planned integrations.

The historical Stage 1 baseline recorded seven TODO defects concerning unreleased
findings, released clause mutation, and premature completion. Batch 2 below converts
all seven to ordinary passing regressions. This is source-level verification; live
authorization/concurrency checks and private document delivery still require review.

## Smoke tests (synthetic users/documents)

- Open landing/login pages and refresh `/client/submit-contract` and an attorney
  nested route: SPA loads and the existing login/role checks apply.
- Login as client and attorney; verify protected calls carry bearer tokens,
  absent/expired tokens receive 401, and wrong roles/owners receive 403.
- Confirm browser API requests target HTTPS Render, allowed-origin preflight
  succeeds, and an unrelated origin receives no access permission.
- Verify registration/password-reset/optional 2FA email delivery with an approved
  test mailbox. Do not perform real email tests without separate approval.
- Upload synthetic digital PDF, scanned PDF and PNG/JPEG; confirm Cloudinary
  upload, Atlas metadata, OCR progress and attorney review/analysis availability.
- Review and release a synthetic report; client can access the released report,
  unrelated client cannot. Check the known TODO defects separately.

## Official provider references

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Docker on Render](https://render.com/docs/docker)
- [Render web services](https://render.com/docs/web-services)
- [Render environment settings](https://render.com/docs/configure-environment-variables)
- [Render Free limitations](https://render.com/docs/free)
## Durable contract processing

The API starts a MongoDB-backed processing worker after connecting to the database.
Saving a contract with `pending` status queues it; request buffers and `setImmediate`
callbacks are not needed for recovery. Each server processes one contract at a time
and checks for work every five seconds. Multiple servers claim work atomically.

Processing leases expire after two minutes and are renewed every forty seconds.
On restart, expired `pending`, `ocr_processing`, and `ai_analysis` jobs become eligible
again. OCR jobs download the original file from this application's Cloudinary account;
analysis jobs reuse persisted sanitized OCR text. Downloads reject redirects, enforce
the 20MB contract ceiling, time out after thirty seconds, and validate magic bytes.
Private recovery uses server-side expiring API signatures; see Batch 3 below.

Analysis commits clause findings and the contract's next status in one MongoDB
transaction. A replica set or MongoDB Atlas is required; a standalone MongoDB server
does not support this commit path. Stale owners cannot commit results. Existing human
clause decisions are preserved. Jobs use at-least-once execution, not exactly-once
notification delivery; notifications are best effort after commits.

Failures retry after thirty seconds multiplied by the attempt number. Each attempt
has a ten-minute deadline.
Timing out invalidates ownership of late results and cancels the isolated extractor.
Extraction also has its own two-minute deadline with process-tree termination.
A process restart still reclaims the lease after two minutes.
The third failed or timed-out attempt routes the contract to manual attorney review. Repeated process crashes
also consume persisted attempts; a replacement worker routes exhausted work to review
without executing it again. Completed, released, and attorney-review contracts are
excluded. Existing interrupted jobs are automatically eligible after deployment.

Schema impact: four optional processing metadata fields and a queue-query index on
Contract. No data migration, counter reset, or unique-index migration is needed.
Deploy on development infrastructure first and verify the new index is available.
Rollback: stop all new workers, revert the application changes, and retain the optional
metadata fields. The old application ignores them, but restart recovery is lost.
Never reset annual counters or delete uploaded documents as part of rollback.

Local verification uses synthetic records and mocked storage/OCR/database operations:
`node --test test/ingestion.test.js test/processingWorker.test.js` from `server/`.
Before claiming live recovery, separately verify on an authorized development replica
set and Cloudinary account: concurrent claims, process termination during OCR/analysis,
recovery after lease expiry, transaction rollback, and same-name uploads. The existing
`scripts/test-atomic-counter.js` touches configured records and resets counters; do not
use it against production or a shared development database.

## Account security changes (Batch 1)

Login now returns a random, ten-minute `challengeId` only after password validation.
The frontend keeps it in memory and sends it with login verification/resend requests.
Refreshing during verification requires starting login again. Challenges and OTPs are
hashed in storage. Resend requires the same challenge, has a sixty-second cooldown,
and does not extend expiry or reset the five-attempt budget. A fresh password login
supersedes the previous challenge. OTPs use Node's cryptographic random generator.

Access JWTs require `purpose: access` and a `sessionVersion` matching the current user.
All pre-change JWTs are rejected, so existing users must sign in again after rollout.
Password changes/resets atomically increment the session version and clear pending
login, recovery, and email-change grants. Reset tokens are consumed atomically.
No secret rotation or bulk user migration is necessary; missing versions are treated
as zero until first updated. Sessions issued before a credential change are rejected
on subsequent authentication checks, not retroactively inside an already running request.

Direct profile email changes are rejected. Both account screens provide a dedicated
email-change form requiring the current password. The code is sent to the new address;
the existing address remains active until confirmation. Confirmation has a ten-minute
expiry/five-attempt budget and atomically changes email, clears challenges and revokes
all sessions. Duplicate-email uniqueness still uses the existing MongoDB index.
Verify that index is present on an authorized development database.

Schema impact: eight optional User fields (session version, login challenge hash/expiry,
resend timestamp, pending email, confirmation hash/expiry/attempt count). Existing
password/reset/OTP fields remain compatible. No dependency installation or migration
was performed. Deploy frontend and backend together because login API requests changed.

Rollback: revert only Batch 1 auth/frontend changes after reviewing newer work, and
retain optional fields. Reverting authentication would remove revocation enforcement;
rotate the JWT secret before serving the reverted app to prevent old-token revival.
Secret rotation is an operator action requiring separate authorization. Do not delete
user records or reset stored session versions.

Synthetic auth regressions: `node --test test/authSecurity.test.js` from `server/`.
JWT signatures and bcrypt hashes run locally; models, delivery, and concurrency are
mocked. Live database concurrency, SMTP delivery and browser flows require separate
development verification. The legacy forgot-password link endpoint's email delivery
remains incomplete; the existing frontend uses the password-reset OTP flow.
Attorney/report remediation is documented below. Processing/storage limits belong
to Batch 3.

## Attorney access and report integrity (Batch 2)

Clients can read their own contract metadata. Unreleased client responses use an
allowlist excluding risk, overrides, notes, extracted text, virtual final risk and
storage URLs. Completed/released reports include only approved or overridden clauses
explicitly marked for inclusion; pending, dismissed, and excluded clauses are filtered
on the backend. Original storage URLs are not returned to clients by these endpoints.

Attorneys can read details, status, findings and reports only for assigned contracts.
The queue contains assigned work plus basic metadata for ready, unassigned contracts.
An explicit PATCH claim is required before reading unassigned findings. Claiming is
one conditional update: no reassignment, processing-stage claims, or implicit writes
from GET routes. Opening a review in the frontend performs this claim before fetching.

Flag edits and completion use transactions and write the same parent Contract to
serialize competing edits/completion. MongoDB Atlas or a replica set is required.
Only the assigned attorney can edit an active, unreleased review. Every clause needs
a decision, including excluded/low-risk clauses, and overrides require an explicit
risk level. Zero-clause contracts cannot complete: manual transcription/clause creation
is still a separate unfinished capability. Existing risk classification rules and
overall AI risk aggregation are unchanged.

Completed findings are immutable. A completed/unreleased draft may be released through
the existing completion endpoint with only `{ "releaseReport": true }`; that action
cannot change notes or risk. Released reports cannot be edited, reassigned or unreleased.
The UI disables completed-report controls and blocks completion with pending/no clauses.
There is no revision/reopen feature in this batch.

Audit listing/export for attorneys is scoped to their own actor records. Contract audit
trails require assignment. Existing administrator audit access remains unchanged.
Audit and notification delivery are best effort after commits, outside transaction
retries. This does not promise exactly-once external notification delivery.

No new schema, migration, package or service was added. Transactions increment the
existing Contract version field; no version reset is needed. Legacy completed drafts
with pending or zero clauses remain blocked for manual reconciliation instead of
being silently published. Deploy frontend and backend together and validate two
synthetic attorneys claiming/reviewing the same contract on an authorized development
replica set before claiming real concurrency guarantees. Browser and live DB checks
are separate from mocked source tests.

Validation: `node --test test/*.test.js` from `server/` includes 24 new Batch 2 tests,
plus seven formerly failing targets now run as ordinary regressions. The isolated
harness models transactions with serialized in-memory snapshots/rollback; it does not
simulate MongoDB write-conflict detection. Production client builds use a synthetic
HTTPS API origin for local validation and do not deploy the generated files.

Rollback: stop changes to reviews, revert only Batch 2 controller/access/frontend/test
changes after reviewing newer work, and retain stored decisions/version values. Reverting
would restore the old access and mutation vulnerabilities. Do not delete contracts,
rewrite attorney decisions or unset report-release flags as part of rollback. Batch 1
session protection and the durable processing worker are separate changes to preserve.

## Processing limits and private contract delivery (Batch 3)

Untrusted PDF parsing and image OCR now run through documentProcessingService in a
separate Node child process. The API retains database orchestration and PII masking;
the child receives document bytes and an explicit environment allowlist containing no
MongoDB, JWT, SMTP or Cloudinary secrets. This is resource/process isolation, not an
OS sandbox: the child runs as the application user and can access that user's files.

Limits: existing contract ceiling 20MB; PDF maximum 50 pages (checked before extracting
text or rasterizing); PNG/JPEG maximum 20 million pixels and 12000 pixels per dimension;
extracted text maximum 250000 characters. Animated PNGs are rejected. PDFs exceeding
limits can be accepted into the durable queue but processing refuses them; repeated
failures route to manual review. Images are checked before contract storage. The
statutory extraction endpoint retains its smaller 5MB upload ceiling and uses the
same isolated processor. Statutory archives retain their existing public delivery type.

Each extractor has a two-minute deadline. The parent terminates its process tree
before deleting its validated scratch directory: process groups on POSIX and
taskkill /T /F on Windows. Converter calls also have a 45-second timeout and fixed
page/output-size arguments. The Node child has a 256MB V8 heap setting; this is not
an OS-wide memory limit on native code or WebAssembly. Two extractor slots and four
document-request slots are available per server process. Multipart file/field/part
counts are bounded. Upload/extraction/download rate limits use authenticated user IDs
so changing IP cannot reset a single account's local budget. These counters/limits
are per process, not distributed across replicas.

The durable worker passes its cancellation signal into download/extraction. Late
results still face lease checks. Parent disconnect triggers child-tree teardown.
If termination cannot be confirmed, the processor fails closed until server restart
and retains scratch for operator inspection instead of deleting a live directory.
Tesseract's public English model may still need downloading; no real scanned-OCR or
language-download test was run in this batch.

New contract uploads request Cloudinary `type: authenticated` and use random storage
IDs without personal filenames. A new optional Contract.cloudinaryDeliveryType field
defaults to upload for legacy compatibility; new records save authenticated explicitly.
Deletion/rollback cleanup uses that stored type. No migration was run and no existing
Cloudinary resources were modified. Legacy public URLs remain a privacy risk until
separately migrated and their cached copies addressed. Removing URLs from API responses
does not revoke previously distributed URLs.

GET /api/contracts/:id/document requires JWT authentication plus client ownership or
attorney assignment. It proxies validated original file bytes with no-store, attachment,
nosniff and sandbox headers. Private downloads use a two-minute signed API URL only
inside the backend, reject redirects and unapproved destinations, apply a thirty-second
download timeout and 20MB stream ceiling, and validate magic bytes. Clients receive
no storage signature/API key/link. Upstream failures return a generic error. Metadata
responses for attorneys also omit direct legacy storage URLs. Client tracking and
attorney review screens download through the protected endpoint using bearer headers.

Cloudinary SDK behavior follows the official [media access control documentation](https://cloudinary.com/documentation/control_access_to_media)
and [Upload API download reference](https://cloudinary.com/documentation/image_upload_api_reference#download).
Actual private PDF/image delivery must be verified on an authorized development
account, including access denial for unsigned originals/derivatives and signed raw-PDF
download. Account restrictions or nonstandard delivery domains require review; no
Cloudinary account configuration was read or changed.

Validation includes mocked size/admission/access/signature/cleanup cases, a real
synthetic digital PDF extraction, rejection of a generated 51-page PDF, and actual
child-process termination/timeout checks. On managed Windows these subprocess tests
need execution outside the sandbox to allow taskkill against their own children.
Run `node --test test/*.test.js` from server/. Browser, scanned OCR, live private
Cloudinary delivery and database schema compatibility remain development smoke checks.

Rollback: pause uploads and workers; revert only Batch 3 after reviewing newer work.
Retain the optional delivery-type column and preserve private-aware download/deletion
support for already authenticated files. Do not make private files public, delete
uploads, migrate legacy assets, or remove arbitrary scratch paths as part of rollback.
Resume only after confirming the reverted worker can retrieve stored private files.


## Account profile synchronization

Account pages restore the current profile through authenticated `GET /api/auth/profile`. Session middleware reads the account from MongoDB; the response includes only public profile fields and disables caching. Expired or revoked sessions are cleared. Connection failures show a retry screen.

Notification toggles send only the changed preference, wait for confirmation, and show save errors. The backend writes individual notification keys so independent updates cannot overwrite another preference. Profile save confirmations and attorney identity displays use saved account data. No schema migration is required.

Deploy the backend before the frontend so the profile read endpoint is available. For rollback, restore the frontend first; the added GET endpoint and partial preference updates remain compatible with the older frontend.

Local verification uses synthetic in-memory accounts, mocked integrations, local HTTP, and simulated React hooks. From the repository root, run `node --test server/test/authSecurity.test.js` and `node --test client/test/profileSync.test.mjs`. These checks do not establish live MongoDB persistence or browser behavior.

QA acceptance after deployment, using designated test accounts for both roles:

1. Change name and contact number, save, reload, and sign out/in. The account page and navigation should agree with the saved values.
2. Type an unsaved name, then change a notification preference. The name must remain unsaved and stay in the form until Save or Cancel.
3. Change each notification preference separately, reload, and confirm both values persisted.
4. Simulate an API failure: the preference must retain its previous value and show an error. A failed profile read must offer Retry and recover after connectivity returns.
5. With an expired session, reload and confirm sign-in is required. Password changes and verified email changes must still revoke sessions.

No deployment is performed by these changes.
