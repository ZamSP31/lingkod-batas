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
outbound access. Ephemeral scratch files are appropriate, but OCR/analysis jobs
run inside the web process and can be interrupted by redeploys or restarts.
Free instances also sleep after inactivity; CPU/memory limits require testing
with synthetic multi-page documents. No durable job queue was added.

`ragService.js` currently uses MongoDB retrieval and rule-based assessment;
external LLMs, Chroma and cloud OCR are not verified working features. Cloud OCR
is explicitly a stub. Hosting does not complete those planned integrations.

The baseline backend tests include seven known TODO defects concerning unreleased
risk/notes visibility, released clause mutation, and premature completion.
These remain outside deployment configuration scope. Use synthetic capstone data
until those privacy and review concerns receive separate remediation.

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
