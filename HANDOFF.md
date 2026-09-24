# 🤝 LINGKOD BATAS — SPRINT HANDOFF & CURRENT STATUS

> **Project:** Lingkod Batas — AI-Powered Employment Contract Checker with Attorney Supervision  
> **Institution:** University of Santo Tomas (UST) — College of Information and Computing Sciences (CICS)  
> **Course:** BS Information Technology (Web & Mobile Development)  
> **Supervising Counsel / Advocate:** Atty. Danielito Jimenez ("Pinoy Street Lawyer", `IBP Roll No. 67890`)  
> **Backend Lead:** Alyzah Zamuelle "Az" San Pablo  
> **Frontend Lead:** Heather Ryann Abon  
> **Documentation / QA Lead:** Sophia Alexandra "Alex" Sargento  
> **Technical Adviser:** Rc Tayuan  
> **Last Updated:** September 24, 2026  
> **Overall Progress:** **10 of 11 Core Functional Requirements Complete (91%)**

---

## 📌 1. Executive Summary & Architecture Philosophy

Lingkod Batas is a hybrid legal-technology web application designed to protect Filipino workers and freelancers from illegal, unconscionable, or one-sided contract provisions. The platform operates on a strict **Human-in-the-Loop (HITL)** architecture:

```
[ Client Uploads Contract (PDF/Image) ]
               │
               ▼
[ Digital Text Extraction / Tesseract OCR Fallback ]
               │
               ▼
[ Clause Segmentation & RAG Risk Classification Engine ]
(Grounded in Philippine Labor Code & DOLE Department Orders)
               │
               ▼
[ Attorney Review Queue (MongoDB Atlas) ]
               │
               ▼
[ Atty. Danielito Jimenez ("Pinoy Street Lawyer") Reviews, Overrides & Annotates ]
               │
               ▼
[ Client Views Verified Legal Analysis & Downloads Final Advisory PDF ]
```

---

## 🚀 2. Functional Requirements Completion Matrix

|   #    | Functional Requirement              |     Status     | Implementation Details                                                                                                                                                                                                                                     |
| :----: | :---------------------------------- | :------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | **User Auth & RBAC**                |  ✅ **100%**   | Dual-role authentication (`client` & `attorney`), JWT session management, smart route guards (`ClientShell`, `AttorneyShell`), and Atty. Jimenez credentials (`IBP Roll No. 67890`).                                                                       |
| **2**  | **Role-Specific Dashboards**        |  ✅ **100%**   | Client dashboard (`ClientDashboardPage.tsx`) with status filters and attorney queue dashboard (`AttorneyDashboardPage.tsx`, `ReviewQueuePage.tsx`).                                                                                                        |
| **3**  | **Contract Upload & Ingestion**     |  ✅ **100%**   | Multipart upload (PDF, PNG, JPEG) with Cloudinary storage and auto-generated unique Case ID (`LB-YYYY-XXXX`).                                                                                                                                              |
| **4**  | **5-Stage Status Tracking**         |  ✅ **100%**   | Live visual tracking stepper (`Submitted` → `Scanning` → `Analyzing` → `Reviewing` → `Report Ready`) in `TrackStatusPage.tsx`.                                                                                                                             |
| **5**  | **Multi-Engine OCR Processing**     |  ✅ **100%**   | Direct digital text parsing (`pdf-parse`) + Tesseract.js fallback for scanned image contracts with async trigger to RAG pipeline.                                                                                                                          |
| **6**  | **AI / RAG Risk Analysis (XAI)**    |  ✅ **100%**   | Clause segmentation, 8 risk categories, statutory retrieval against Philippine Labor Code and DOLE issuances, automated risk rating with plain-English rationales.                                                                                         |
| **7**  | **Attorney Review Workspace**       |  ✅ **100%**   | Multi-level override popover, instant `↺ Reset to AI` safeguard, personal attorney advice note editor, and report release flow in `ReviewQueuePage.tsx`.                                                                                                   |
| **8**  | **Legal Report & PDF Export**       |  ✅ **100%**   | Live verified findings, Atty. Jimenez advice notes, next steps checklist, official law clinic letterhead ("Pinoy Street Lawyer"), and printable ISO A4 PDF export.                                                                                         |
| **9**  | **Statutory Corpus (KB) Full CRUD** |  ✅ **100%**   | Full CRUD for Labor Code, DOLE Orders, Supreme Court rulings with document upload (PDF/DOCX), automatic text extraction, and vector/full-text indexing (`kbController.js`, `StatutoryCorpusPage.tsx`, `AddStatutorySourcePage.tsx`).                       |
| **10** | **Audit Logs & Compliance**         |  ✅ **100%**   | Immutable Mongoose `AuditLog` model, fail-safe `auditService`, comprehensive controller instrumentation (auth, upload, OCR, AI, attorney review, statutory CRUD), and `/attorney/audit-logs` dashboard with CSV export.                                    |
| **11** | **In-App Notifications Subsystem**  |  ✅ **100%**   | Mongoose `Notification` model, fail-safe `notificationService.js`, authenticated REST API (`/api/notifications`), automated event triggers across contract lifecycle, and real-time dropdown panel in `NotificationsMenu.tsx` with polling and deep links. |
| **12** | **FAQ Legal Assistant Chatbot**     | ⏳ **Pending** | Client assistant widget in `ChatbotWidget.tsx` currently uses mock responses. Needs backend endpoint (`POST /api/chat/message`) grounded on active statutory corpus.                                                                                       |

---

## 🛠️ 3. Accomplishments in the Current Sprint (September 2026)

1. **Live In-App Notifications Subsystem (Completed)**:
   - Built Mongoose `Notification.js` schema (`recipient`, `contract`, `type`, `title`, `message`, `read`, `link`, `createdAt`).
   - Implemented `notificationService.js` with `createNotification` and `notifyAttorneys` helpers designed for safe, asynchronous execution.
   - Built authenticated `/api/notifications` endpoints (`GET /`, `PATCH /:id/read`, `PATCH /read-all`, `DELETE /:id`).
   - Instrumented contract lifecycle dispatchers:
     - `contract-submitted`: Dispatches confirmation to client and alerts reviewing attorneys when a new contract is queued.
     - `analysis-complete`: Dispatches readiness alerts to client and counsel once OCR & RAG pipeline finishes.
     - `attorney-reviewing`: Alerts client when Atty. Danielito Jimenez assigns or begins active review.
     - `report-ready`: Alerts client with a direct link to the finalized advisory report.
   - Wired `client/src/components/shared/NotificationsMenu.tsx` to `notificationService.ts` with unread count badge, 20-second background polling, optimistic updates, and deep-link routing.

2. **Statutory Corpus Full CRUD & Document Upload Engine**:
   - Upgraded `server/src/models/StatutorySource.js` with file attachment metadata (`fileUrl`, `filePublicId`, `fileName`, `fileSize`, `fileType`).
   - Integrated Cloudinary document uploads and automated text extraction via `pdf-parse` (for PDF) and `mammoth` (for DOCX) in `kbController.js`.
   - Unified Create and Edit statutory provision page (`AddStatutorySourcePage.tsx`) with drag-and-drop `FileDropzone`.
   - Added attachment badges, source edit action, and safe deletion confirmation dialog in `StatutoryCorpusPage.tsx`.

3. **Immutable Audit Logs Subsystem**:
   - Created Mongoose `AuditLog.js` schema and resilient `auditService.js`.
   - Instrumented all critical controllers (`authController.js`, `contractController.js`, `ocrService.js`, `ragService.js`, `attorneyController.js`, and `kbController.js`).
   - Implemented `/api/audit-logs` routes and `/attorney/audit-logs` dashboard with CSV export and category badges.

4. **Advocacy Branding ("Pinoy Street Lawyer") & UI Polish**:
   - Branded attorney portal, official report letterheads, and certification blocks with Atty. Danielito Jimenez ("Pinoy Street Lawyer", `IBP Roll No. 67890`).
   - Cleaned redundant checkboxes in `ContractsTable.tsx` to streamline the review workflow.
   - Updated and validated Terms of Service and Privacy Policy for Philippine Labor Law and Data Privacy Act (RA 10173) compliance.

5. **Data Privacy Act (RA 10173) PII Sanitization & OCR Natural Sorting**:
   - Built `server/src/utils/piiSanitizer.js` to automatically detect and redact Sensitive Personal Information (SPI) from raw contract OCR output (TIN, SSS, PhilHealth, Pag-IBIG, mobile/telephone numbers, personal emails, bank/payroll accounts, and government IDs).
   - Ensured zero false-positives against Philippine legal citations (e.g. Labor Code Art. 279, Art. 113, DOLE D.O. 147-15).
   - Added `PII_REDACTION_APPLIED` audit logging trail with categorized redaction counts.
   - Fixed lexical sorting bug in `ocrService.js` by introducing numeric natural page sorting (`page-1.png`, `page-2.png`, ..., `page-10.png`).
   - Added official "RA 10173 Protected" badge on the client report page and print letterhead.

---

## 🔮 4. Immediate Remaining Work (Sprint Backlog to 100%)

### FAQ Legal Assistant Chatbot

- **Backend Endpoint (`POST /api/chat/message`)**:
  - Semantic and keyword retrieval against active `StatutorySource` documents.
  - Return plain-language legal explanations for frequent Philippine labor inquiries (minimum wage, 13th-month pay, overtime rates, probation duration, legal termination grounds).
  * Prominent statutory disclaimer: _"Informational guidance only; does not establish an attorney-client relationship."_
- **Frontend Wiring**:
  - Connect `ChatbotWidget.tsx` to the live endpoint, add typing indicator, and render citation badges.

---

## 🏃 5. How to Run & Verify the Project

### Prerequisites

- Node.js v18+
- Active MongoDB Atlas connection (`MONGO_URI` configured in `server/.env`)
- Cloudinary credentials in `server/.env`

### Start Backend API Server

```bash
cd server
npm install
npm run dev
# Running on http://localhost:5000
```

### Start Frontend Client

```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

### Automated Code Quality Checks

```bash
# Frontend build & TypeScript verification
cd client
npm run build    # Output: 0 errors

# Backend linting check
cd server
npm run lint     # Output: 0 errors, 0 warnings
```

---

## 🔑 6. Active Test Credentials

- **Lead Managing Counsel:** `attorney@lingkodbatas.ph` / `Password123!` (Atty. Danielito Jimenez, IBP Roll No. 67890)
- **Associate Reviewer:** `atty.delacruz@lingkodbatas.ph` / `Password123!` (Atty. Dela Cruz)
- **Standard Client:** `client.sample@lingkodbatas.ph` / `Password123!`

---

_Report prepared for the Lingkod Batas Capstone Team._
