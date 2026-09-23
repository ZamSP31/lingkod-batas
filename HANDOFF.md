# ⚖️ LINGKOD BATAS — CAPSTONE PROJECT HANDOFF & PROGRESS REPORT

**Project Name:** Lingkod Batas: An AI-Powered Contract Checker for Unfair Employment Clauses with Attorney Verification  
**Lead Developer:** Alyzah Zamuelle "Az" San Pablo (_Back-end Lead_)  
**Team Members:** Heather (_Front-end Lead_), Sophia Alexandra "Alex" Sargento (_QA Lead_)  
**Advocacy & Practitioner:** **Atty. Danielito Jimenez** (_"Pinoy Street Lawyer"_, Managing Counsel & Lead Reviewer, `IBP Roll No. 67890`)  
**Date Updated:** September 23, 2026  
**Overall Completion:** **~95%** (Core Review Engine & Pinoy Street Lawyer Advocacy 100% Live)

---

## 📌 1. Project Overview & System Architecture

Lingkod Batas is a hybrid legal-tech platform combining **Automated OCR & Retrieval-Augmented Generation (RAG) AI** with **Licensed Attorney Oversight (Human-in-the-Loop)** to identify unfair, unconscionable, or illegal provisions in Philippine employment contracts.

```
[ Client Document Upload (PDF/Image) ]
               │
               ▼
[ OCR Text Extraction (Direct / Tesseract) ]
[ OCR Text Extraction (Direct Digital / Tesseract Engine) ]
               │
               ▼
[ Clause Segmentation & Categorization Engine ]
[ Clause Segmentation & Categorization Engine (8 Labor Domains) ]
               │
               ▼
[ Statutory RAG Analysis against 15 Philippine Labor Code Articles ]
               │
               ▼
[ Awaiting Review Queue in MongoDB Atlas ]
               │
               ▼
[ Atty. Jimenez Reviews, Overrides, Annotates & Releases Report ]
               │
               ▼
[ Client Views Verified Legal Analysis & Downloads Final Advisory PDF ]
```

---

## 🚀 2. Current Progress & Feature Completion Matrix

| Module                 | Component                      |     Status     | Description                                                                                                                                                                              |
| :--------------------- | :----------------------------- | :------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth & RBAC**        | JWT Auth & Sessions            |    ✅ 100%     | Role-based authentication (`client` & `attorney`). Atty. Jimenez profile synced.                                                                                                         |
| **Knowledge Base**     | Statutory Corpus Engine        |    ✅ 100%     | 15 Philippine Labor Code, DOLE Orders, and Supreme Court jurisprudence seeded & searchable.                                                                                              |
| **AI / RAG Pipeline**  | Clause Segmenter & Risk Engine |    ✅ 100%     | Rule-based sectioning, category classifier (8 categories), vector/keyword statutory matching, automated flag creation.                                                                   |
| **OCR Processing**     | Multi-Engine OCR               |    ✅ 100%     | Direct digital PDF extraction + Tesseract OCR fallback for scanned images; async trigger to RAG pipeline.                                                                                |
| **Client Frontend**    | Dashboard & Track Status       |    ✅ 100%     | Clean empty state for new users, live contract list, 5-stage real-time progress stepper.                                                                                                 |
| **Client Frontend**    | Contract Upload                |    ✅ 100%     | Multipart form upload assigned directly to Atty. Jimenez (`Direct Review`).                                                                                                              |
| **Attorney Frontend**  | Review Queue Dashboard         |    ✅ 100%     | Real-time queue from database, high-contrast table headers, filter tabs (`All`, `Awaiting Review`, `Completed`).                                                                         |
| **Attorney Frontend**  | Clause Review Workspace        |    ✅ 100%     | Live AI flags, statutory citations, floating override popover, instant `↺ Reset to AI`, and prominent attorney advice card.                                                              |
| **Deliverables**       | Client Final Report & PDF      |    ✅ 100%     | Live verified findings, Atty. Jimenez advice notes, next steps checklist, and printable PDF export.                                                                                      |
| Module                 | Component                      |     Status     | Description                                                                                                                                                                              |
| :---                   | :---                           |     :---:      | :---                                                                                                                                                                                     |
| **Auth & RBAC**        | JWT Auth & Role Guards         |    ✅ 100%     | Dual-role authentication (`client` & `attorney`). Atty. Jimenez profile synced (`IBP Roll No. 67890`). Smart route guards in `ClientShell` and `AttorneyShell`.                          |
| **Knowledge Base API** | Statutory Corpus Engine        |    ✅ 100%     | 15 Philippine Labor Code, DOLE Orders, and Supreme Court doctrines seeded in MongoDB Atlas with full-text search.                                                                        |
| **Knowledge Base UI**  | Statutory Corpus Browser       |    ✅ 100%     | Live search table in `StatutoryCorpusPage.tsx`, full verbatim statutory provision modal, and dynamic DOLE source registration form (`AddStatutorySourcePage.tsx`).                       |
| **AI / RAG Pipeline**  | Clause Segmenter & Risk Engine |    ✅ 100%     | Rule-based sectioning, category classifier (8 categories), vector/keyword statutory matching, automated flag creation.                                                                   |
| **OCR Processing**     | Multi-Engine OCR               |    ✅ 100%     | Direct digital PDF extraction + Tesseract OCR fallback for scanned images; async trigger to RAG pipeline.                                                                                |
| **Client Frontend**    | Dashboard & Track Status       |    ✅ 100%     | Clean empty state for new users, live contract list, 5-stage real-time progress stepper, and copyable Case ID buttons.                                                                   |
| **Client Frontend**    | Contract Upload                |    ✅ 100%     | Multipart form upload assigned directly to Atty. Jimenez (`Direct Review`) with Cloudinary storage.                                                                                      |
| **Attorney Frontend**  | Review Queue Dashboard         |    ✅ 100%     | Real-time queue from database, high-contrast table headers, filter tabs (`All`, `Awaiting Review`, `Completed`).                                                                         |
| **Attorney Frontend**  | Clause Review Workspace        |    ✅ 100%     | Live AI flags, statutory citations, floating override popover, instant `↺ Reset to AI`, and personal attorney advice note editor.                                                        |
| **Deliverables**       | Client Final Report & PDF      |    ✅ 100%     | Live verified findings, Atty. Jimenez advice notes, next steps checklist, official law clinic letterhead, and printable ISO A4 PDF export.                                               |
| **UI/UX Polish**       | Micro-Interactions & Skeletons |    ✅ 100%     | Page entry transitions (`animate-fade-in-up`), hover-lift card physics, button spring feedback, parchment custom scrollbars, and `TableSkeleton` loaders.                                |
| **Audit Logs**         | Immutable Trail & Export       |    ✅ 100%     | Mongoose `AuditLog` model, fail-safe `auditService`, controller instrumentation (auth, upload, OCR, AI, attorney review, statutory CRUD), and `/attorney/audit-logs` UI with CSV export. |
| **Notifications**      | In-App Alerts System           | ⏳ **Pending** | Currently mocked in `NotificationsMenu.tsx`. Needs MongoDB `Notification` model, REST API (`/api/notifications`), and automated event dispatch triggers.                                 |
| **Chatbot**            | Grounded Legal Assistant       | ⏳ **Pending** | Currently mocked in `ChatbotWidget.tsx` with static canned replies. Needs backend endpoint (`/api/chat/message`) grounded against the active statutory corpus.                           |

## 🛠️ 3. Accomplishments in the Current Sprint

---

1. **Live AI Clause Analysis & Flagging Connected**:
   - Replaced static mock data (`Contract_0417.pdf`) with live MongoDB Atlas flags.
   - Clause text, AI rationales, and Philippine statutory citations load in real-time.
2. **Attorney Safety & Modern UI/UX Controls**:
   - **Multi-Level Override Popover**: Anchored dropdown allowing classification into _Clear (Low)_, _Medium-Risk_, or _High-Risk_.
   - **Instant "↺ Reset to AI"**: Accident protection button that immediately restores the original AI assessment.
   - **Dedicated Attorney Personal Note Card**: Prominent section allowing counsel to add tailored renegotiation guidance for the client.
   - **Clause Isolation**: Added unique component keying to prevent state leakage across different clauses.
   - **Modern Review Checkmarks**: Subtle subtitle status pills (`✓ Reviewed` / `✓ Overridden`) replacing raw characters.
3. **Queue Workflow & Database Cleanup**:
   - Cleaned up automated test contracts (`Automated Test Software Engineer Agreement`, etc.).
   - Updated attorney database profile to **Atty. Jimenez** (`IBP Roll No. 67890`).
   - Enhanced `GET /api/attorney/queue` to preserve completed contracts with `APPROVED / COMPLETED` badges.
   - Fixed table header contrast with solid `#ECE5D6` parchment bar and double-strength border.

## 🛠️ 3. Accomplishments in the Current Sprint (September 2–9, 2026)

1. **Live Statutory Corpus Integration (`/api/knowledge-base`)**:
   - Replaced mock data in `StatutoryCorpusPage.tsx` with live queries against MongoDB Atlas via `kbService.ts`.
   - Built a dynamic keyword search bar and a full-text modal displaying verbatim statutory provisions and tags.
   - Connected `AddStatutorySourcePage.tsx` to `POST /api/knowledge-base` so counsel can register new DOLE issuances directly from the app.
2. **UI/UX Micro-Interactions & Toast Notification System**:
   - Built global `ToastContext.tsx` with animated slide-in confirmation toasts and fail-safe defaults for attorney overrides, resets, and note saves.
   - Added `TableSkeleton.tsx` and `ReportSkeleton.tsx` warm parchment loaders to eliminate layout shifts (CLS).
   - Added hover card lift (`hover-lift`), tactile button springs, and custom `6px` parchment-styled scrollbars.
   - Built `CopyButton.tsx` with animated `✓ Copied!` state for instant reference number copying.
3. **Formal Legal Advisory PDF / Print Engine (`ContractReportPage.tsx`)**:
   - Built official law clinic letterhead, audit metadata, executive compliance summary, page-break safety (`.print-avoid-break`), employee legal action plan, and Atty. Jimenez signature block.
   - Configured `@media print` rules hiding all web chrome for publication-ready A4 exports.
4. **Codebase Health & Tooling**:
   - Fixed JSX tag mismatches and `<ToastProvider>` nesting in `main.tsx`.
   - Repaired Git index state following unexpected system restart.
   - Configured `server/.eslintrc.json` and cleaned all ESLint warnings (`0 errors, 0 warnings`).
   - Authored master technical and operational manual (`CLAUDE.md`).

---

## 🔮 4. Next Recommended Steps (Final Sprint to 100%)

## 🔮 4. Immediate Remaining Work (Sprint Backlog to 100%)

1. **Wire the Client Final Report Page (`ContractReportPage.tsx`)**:
   - Fetch live completed contract data and Atty. Jimenez's approved flags and custom advice notes.
   - Add a **"Recommended Next Steps / Action Plan"** card for the client at the bottom.
2. **Add "View Report" CTA on Track Status Stepper (`TrackStatusPage.tsx`)**:
   - When Stage 05 (Completed) is reached, display a prominent celebratory banner:  
     `[ View Final Verified Report → ]`.
3. **Implement PDF Report Generator**:
   - Export an official printable **Philippine Legal Advisory Report** with firm header, verified stamp, and risk breakdown.
4. **Connect Statutory Corpus Browser (`StatutoryCorpusPage.tsx`)**:
   - Wire the search bar and table to `GET /api/knowledge-base/sources` and `POST /api/knowledge-base/sources`.

### Feature A: Live In-App Notifications Subsystem

- **Backend Model (`server/src/models/Notification.js`)**:
  - Fields: `user` (ref: User), `contract` (ref: Contract), `type` (`contract-submitted`, `analysis-complete`, `attorney-reviewing`, `report-ready`), `title`, `message`, `read`, `link`, `createdAt`.
- **Backend Routes & Controller (`/api/notifications`)**:
  - `GET /api/notifications` (list user's notifications sorted by newest).
  - `PATCH /api/notifications/read-all` (mark all notifications as read).
  - `PATCH /api/notifications/:id/read` (mark single notification as read).
- **Event Triggers**:
  - Dispatch notification to client on contract submission and report release.
  - Dispatch notification to attorney when a new contract enters the review queue.
- **Frontend Wiring (`NotificationsMenu.tsx` & `RecentActivityPanel.tsx`)**:
  - Fetch real notifications from database, show unread count badge on bell icon, and sync read status.

### Feature B: Live Grounded Legal Chatbot Assistant

- **Backend Endpoint (`POST /api/chat/message`)**:
  - Receives user query and semantic intent.
  - Queries `StatutorySource` for matching Philippine labor statutes (working hours, wage deductions, probation, non-competes, termination).
  - Returns structured response with cited statutory provisions and disclaimers.
- **Frontend Wiring (`ChatbotWidget.tsx`)**:
  - Connect input to `/api/chat/message`.
  - Add typing indicator and statutory citation pills on bot messages.

---

## 🏃 5. How to Run the Project Locally

## 🏃 5. How to Run & Verify the Project

### Prerequisites

- Node.js v18+
- MongoDB Atlas Connection (`MONGO_URI` in `server/.env`)
- Active MongoDB Atlas connection (`MONGO_URI` configured in `server/.env`)

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

### Key Test Accounts

### Automated Code Quality Checks

```bash
# Frontend bundle & TypeScript check
cd client
npm run build    # Verified: 0 errors

- **Managing Attorney:** `attorney@lingkodbatas.ph` / `Password123!` (Atty. Jimenez)
- **Client User:** Create any new client account at `/register` or login with your client credentials.
# Backend linting check
cd server
npm run lint     # Verified: 0 errors, 0 warnings
```

### Key Active Test Credentials

- **Lead Managing Counsel:** `attorney@lingkodbatas.ph` / `Password123!` (Atty. Jimenez, IBP Roll No. 67890)
- **Associate Reviewer:** `atty.delacruz@lingkodbatas.ph` / `Password123!` (Atty. Dela Cruz)
- **Standard Client:** `client.sample@lingkodbatas.ph` / `Password123!`

---

_Report prepared for ZamSP31 and the Lingkod Batas Capstone Team._
