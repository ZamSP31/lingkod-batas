# ⚖️ LINGKOD BATAS — MASTER SYSTEM SPECIFICATION & ARCHITECTURE MANUAL

> **Confidential Capstone Project Documentation**  
> **Project Name:** Lingkod Batas (An AI-Powered Contract Checker for Unfair Employment Clauses with Attorney Verification)  
> **Institution:** University of Santo Tomas (UST) — College of Information and Computing Sciences (CICS)  
> **Supervising Counsel / Advocate:** Atty. Danielito Jimenez ("Pinoy Street Lawyer", `IBP Roll No. 67890`) & Associate Attorneys  
> **Lead Developers:** Alyzah Zamuelle "Az" San Pablo (_Back-end Lead_), Heather Ryann Abon (_Front-end Lead_), Sophia Alexandra "Alex" Sargento (_QA / Documentation Lead_)  
> **Technical Adviser:** Rc Tayuan  
> **Status:** 10 of 11 Functional Requirements Complete (91%) — Production-Ready Core Workflow

---

## 1. System Overview & Philosophy

Lingkod Batas is a hybrid legal-tech web platform designed to protect Philippine workers from unconscionable, illegal, and abusive provisions in employment agreements. The system enforces a **Human-in-the-Loop (HITL)** paradigm:

1. **Automated Layer**: Fast OCR, heuristic clause segmentation, and statutory RAG (Retrieval-Augmented Generation) risk analysis against Philippine labor laws.
2. **Attorney Oversight Layer**: Licensed Philippine attorneys (specifically Atty. Danielito Jimenez) audit every AI-flagged clause, override risk levels, attach personal legal advice notes, and officially release the final verified report.
3. **Client Advisory Layer**: Clients track progress in real-time and receive a formal, publication-ready legal advisory report with actionable renegotiation steps and printable PDF export.

---

## 2. Technology Stack & Directory Layout

### 2.1. Backend (`/server`)

- **Runtime:** Node.js (CommonJS, Express v4.19)
- **Database:** MongoDB Atlas via Mongoose v8.5
- **Document Storage:** Cloudinary via Multer memory storage
- **OCR Engine:** Direct digital PDF parsing (`pdf-parse`) + Tesseract.js fallback for scanned image contracts
- **Security:** `bcryptjs` for password hashing, `jsonwebtoken` (JWT) for authenticated sessions, CORS origin whitelisting

### 2.2. Frontend (`/client`)

- **Framework:** React 19 + TypeScript (`exactOptionalPropertyTypes: true`)
- **Build Tool:** Vite v8
- **Routing:** React Router v7 (`react-router-dom`)
- **Styling:** Tailwind CSS v4 with custom brand tokens:
  - Deep Navy: `#0E1830` / `#16233F`
  - Deep Maroon: `#7C2635` / `#9C3245`
  - Parchment: `#F2ECDF` / `#E8DFCB`
  - Gold Accent: `#B08D4F`
  - Forest Green: `#4C7A5E`
- **Typography:** Fraunces (serif display), Public Sans (body sans), IBM Plex Mono (monospace)

---

## 3. Database Models & Schema Specifications

### 3.1. `User` (`server/src/models/User.js`)

- `fullName`: String, required, trimmed
- `email`: String, required, unique, lowercase
- `password`: String, required, minlength 8 (hashed with bcrypt)
- `role`: Enum `['client', 'attorney', 'admin']` (default: `'client'`)
- `phone`: String, optional
- `attorneyProfile`:
  - `rollNumber`: String (e.g., `"IBP Roll No. 67890"`)
  - `ibpChapter`: String
  - `specialization`: Array of strings
  - `isVerified`: Boolean (default: `true`)

### 3.2. `Contract` (`server/src/models/Contract.js`)

- `requestNumber`: String, unique (e.g., `"LB-2026-0001"`)
- `title`: String, required
- `client`: ObjectId -> `User`
- `assignedAttorney`: ObjectId -> `User` (assigned to Atty. Danielito Jimenez)
- `fileUrl`: String (Cloudinary secure URL)
- `filePublicId`: String
- `fileType`: Enum `['pdf', 'image']`
- `status`: Enum `['submitted', 'queued_for_ocr', 'ocr_complete', 'analysis_complete', 'under_attorney_review', 'approved', 'rejected']`
- `extractedText`: String (full OCR text with RA 10173 PII redactions)
- `piiSanitized`: Boolean (indicates automated redaction executed)
- `piiRedactionCount`: Number (count of redacted Sensitive Personal Information tokens)
- `overallRiskLevel`: Enum `['low', 'medium', 'high']`
- `attorneyNotes`: String
- `reviewedAt`: Date

### 3.3. `ClauseFlag` (`server/src/models/ClauseFlag.js`)

- `contract`: ObjectId -> `Contract`
- `clauseText`: String, required (extracted contract excerpt)
- `clauseNumber`: Number
- `riskCategories`: Array of Enums:
  - `wage_and_hours`
  - `termination`
  - `non_compete`
  - `confidentiality`
  - `liability_waiver`
  - `intellectual_property`
  - `jurisdiction`
  - `contracting_and_subcontracting`
  - `other`
- `aiRiskLevel`: Enum `['low', 'medium', 'high']`
- `aiConfidence`: Number (0.00 to 1.00)
- `aiRationale`: String (plain-language explanation of legal risk)
- `statutoryBases`: Array of `{ citation: String, provisionNumber: String, excerpt: String }`
- `attorneyStatus`: Enum `['pending', 'approved', 'overridden', 'dismissed']`
- `attorneyRiskOverride`: Enum `['low', 'medium', 'high', null]`
- `attorneyNote`: String (personal legal advice note to the client)
- `reviewedBy`: ObjectId -> `User`
- `reviewedAt`: Date

### 3.4. `StatutorySource` (`server/src/models/StatutorySource.js`)

- `citation`: String, required, unique (e.g., `"Labor Code, Art. 113"`)
- `title`: String, required
- `sourceType`: Enum `['labor_code', 'dole_department_order', 'dole_advisory', 'republic_act', 'other']`
- `provisionNumber`: String
- `provisionText`: String, required (verbatim legal text)
- `tags`: Array of category strings
- `isActive`: Boolean (default: `true`)
- `fileUrl`: String (Cloudinary secure URL)
- `filePublicId`: String
- `fileName`: String
- `fileSize`: Number (in bytes)
- `fileType`: String (`application/pdf`, `docx`, etc.)

### 3.5. `AuditLog` (`server/src/models/AuditLog.js`)

- `action`: String, required (e.g., `'USER_LOGIN'`, `'CONTRACT_SUBMITTED'`, `'ATTORNEY_OVERRIDE'`)
- `category`: Enum `['AUTH', 'CONTRACT', 'ANALYSIS', 'ATTORNEY_REVIEW', 'KNOWLEDGE_BASE', 'SYSTEM']`
- `actor`: `{ userId: ObjectId -> User, email: String, role: String }`
- `target`: `{ entityType: String, entityId: String, entityName: String }`
- `ipAddress`: String
- `userAgent`: String
- `status`: Enum `['SUCCESS', 'FAILURE', 'WARNING']`
- `metadata`: Schema.Types.Mixed (diffs, overrides, extraction metrics)
- `createdAt`: Date (default: `Date.now`, indexed)

### 3.6. `Notification` (`server/src/models/Notification.js`)

- `recipient`: ObjectId -> `User`, required, indexed
- `contract`: ObjectId -> `Contract`, optional
- `type`: Enum `['contract-submitted', 'analysis-complete', 'attorney-reviewing', 'report-ready']`
- `title`: String, required
- `message`: String, required
- `read`: Boolean (default: `false`, indexed)
- `link`: String, optional (deep-link to status or review workspace)
- `createdAt`: Date (default: `Date.now`, indexed)

---

## 4. REST API Endpoint Catalog

### 4.1. Auth Routes (`/api/auth`)

- `POST /register`: Registers a new client
- `POST /login`: Validates credentials, returns JWT token + user payload
- `GET /me`: Returns current authenticated user profile (`protect` middleware)

### 4.2. Contract Routes (`/api/contracts`)

- `POST /`: Uploads contract to Cloudinary, extracts text via OCR, triggers RAG analysis asynchronously (`authorize('client', 'attorney')`)
- `GET /`: Lists all contracts for current user (clients see own; attorneys see assigned queue)
- `GET /:id`: Retrieves single contract record
- `GET /:id/report`: Retrieves finalized verified report with all flags, legal bases, and attorney advice notes

### 4.3. Attorney Workspace Routes (`/api/attorney`)

- `GET /queue`: Returns attorney review queue with filter tabs (`all`, `awaiting`, `completed`)
- `GET /contracts/:id/flags`: Returns all clause flags for interactive review workspace
- `PATCH /flags/:flagId`: Overrides risk level and/or updates attorney personal advice note
- `PATCH /contracts/:id/complete`: Finalizes review, releases report to client, and updates status to `approved`

### 4.4. Knowledge Base Routes (`/api/knowledge-base`)

- `GET /`: Lists and searches statutory sources (supports `?q=` search query)
- `GET /:id`: Retrieves single statutory source
- `POST /`: Registers a new statutory citation with optional PDF/DOCX file upload & text extraction (`authorize('attorney', 'admin')`)
- `PATCH /:id`: Updates existing statutory source with optional file replacement
- `DELETE /:id`: Soft-deletes/deactivates statutory source

### 4.5. Audit Log Routes (`/api/audit-logs`)

- `GET /`: Paginated list of audit logs with category, date, action, and search filtering (`authorize('attorney', 'admin')`)
- `GET /export`: Generates downloadable CSV export of filtered audit logs
- `GET /stats`: Aggregated summary statistics of security and compliance events

### 4.6. Notification Routes (`/api/notifications`)

- `GET /`: Retrieves paginated notifications and unread badge count for authenticated user
- `PATCH /:id/read`: Marks a single notification as read
- `PATCH /read-all`: Marks all user notifications as read
- `DELETE /:id`: Removes a notification from the user's feed

---

## 5. Seeded Credentials & Test Accounts

- **Lead Managing Attorney (Atty. Danielito Jimenez):**
  - Email: `attorney@lingkodbatas.ph`
  - Password: `Password123!`
  - Role: `attorney`
  - Portal: `http://localhost:5173/attorney`
  - Advocacy: "Pinoy Street Lawyer"
  - IBP Roll: `IBP Roll No. 67890`

- **Associate Attorney (Atty. Dela Cruz):**
  - Email: `atty.delacruz@lingkodbatas.ph`
  - Password: `Password123!`
  - Role: `attorney`

- **Standard Client:**
  - Email: `client.sample@lingkodbatas.ph`
  - Password: `Password123!`
  - Role: `client`
  - Portal: `http://localhost:5173/client`

---

## 6. Official Legal Report & PDF Print Engine

- **Format:** Standard ISO A4 Portrait (`15mm 18mm` margins)
- **Web-to-Print Transformation:**
  - Shell chrome (`ClientSidebar`, `ChatbotWidget`, notification bell) automatically hidden via `print:hidden`
  - Formal law clinic letterhead with "Pinoy Street Lawyer" branding, seal, and case audit metadata
  - Executive summary and compliance score matrix
  - Individual clause risk cards with `.print-avoid-break` to prevent page cuts across clauses
  - Employee action plan with negotiation leverage guidance
  - Official law clinic certification block with Atty. Danielito Jimenez's signature line and IBP Roll details

---

## 7. Functional Requirements Completion & Remaining Backlog

| Feature Area                     |   Status   | Notes                                                                                                         |
| :------------------------------- | :--------: | :------------------------------------------------------------------------------------------------------------ |
| **Auth & RBAC**                  |  ✅ Done   | Dual-role JWT auth with route protection                                                                      |
| **Client & Attorney Dashboards** |  ✅ Done   | Responsive views, quick filters, and stats                                                                    |
| **Contract Ingestion & Storage** |  ✅ Done   | Cloudinary storage, unique LB IDs                                                                             |
| **5-Stage Contract Tracking**    |  ✅ Done   | Live stage stepper                                                                                            |
| **Multi-Engine OCR**             |  ✅ Done   | Direct PDF parse + Tesseract fallback                                                                         |
| **AI / RAG Risk Analysis (XAI)** |  ✅ Done   | Clause segmentation, 8 categories, Labor Code citations                                                       |
| **Attorney Review & Overrides**  |  ✅ Done   | Multi-level override popover, reset safeguards, custom notes                                                  |
| **Legal Advisory PDF Report**    |  ✅ Done   | A4 print layout, letterhead, seal, and certification                                                          |
| **Statutory Corpus CRUD**        |  ✅ Done   | Document upload (PDF/DOCX), text extraction, full CRUD                                                        |
| **Audit Logs & Export**          |  ✅ Done   | Mongoose model, fail-safe service, `/attorney/audit-logs` UI & CSV                                            |
| **In-App Notifications**         |  ✅ Done   | Model, REST API (`/api/notifications`), lifecycle triggers, `NotificationsMenu.tsx` with polling & deep links |
| **FAQ Legal Chatbot**            | ⏳ Pending | Widget exists in `ChatbotWidget.tsx`; backend endpoint `/api/chat/message` pending                            |
