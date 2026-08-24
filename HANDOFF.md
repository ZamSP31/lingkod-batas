# ⚖️ LINGKOD BATAS — CAPSTONE PROJECT HANDOFF & PROGRESS REPORT

**Project Name:** Lingkod Batas (An AI-Powered Contract Checker for Unfair Employment Clauses)  
**Lead Developer:** Alyzah Zamuelle "Az" San Pablo (*Back-end Lead*)  
**Teammate:** Heather (*Front-end*)  
**Solo Practitioner Context:** Specifically tailored to **Atty. Jimenez** (*Managing Counsel & Lead Reviewer*) and his clients  
**Date:** August 25, 2026  
**Overall Completion:** **~90%**

---

## 📌 1. Project Overview & System Architecture

Lingkod Batas is a hybrid legal-tech platform combining **Automated OCR & Retrieval-Augmented Generation (RAG) AI** with **Licensed Attorney Oversight (Human-in-the-Loop)** to identify unfair, unconscionable, or illegal provisions in Philippine employment contracts.

```
[ Client Document Upload (PDF/Image) ]
               │
               ▼
[ OCR Text Extraction (Direct / Tesseract) ]
               │
               ▼
[ Clause Segmentation & Categorization Engine ]
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

| Module | Component | Status | Description |
| :--- | :--- | :---: | :--- |
| **Auth & RBAC** | JWT Auth & Sessions | ✅ 100% | Role-based authentication (`client` & `attorney`). Atty. Jimenez profile synced. |
| **Knowledge Base** | Statutory Corpus Engine | ✅ 100% | 15 Philippine Labor Code, DOLE Orders, and Supreme Court jurisprudence seeded & searchable. |
| **AI / RAG Pipeline** | Clause Segmenter & Risk Engine | ✅ 100% | Rule-based sectioning, category classifier (8 categories), vector/keyword statutory matching, automated flag creation. |
| **OCR Processing** | Multi-Engine OCR | ✅ 100% | Direct digital PDF extraction + Tesseract OCR fallback for scanned images; async trigger to RAG pipeline. |
| **Client Frontend** | Dashboard & Track Status | ✅ 100% | Clean empty state for new users, live contract list, 5-stage real-time progress stepper. |
| **Client Frontend** | Contract Upload | ✅ 100% | Multipart form upload assigned directly to Atty. Jimenez (`Direct Review`). |
| **Attorney Frontend** | Review Queue Dashboard | ✅ 100% | Real-time queue from database, high-contrast table headers, filter tabs (`All`, `Awaiting Review`, `Completed`). |
| **Attorney Frontend** | Clause Review Workspace | ✅ 100% | Live AI flags, statutory citations, floating override popover, instant `↺ Reset to AI`, and prominent attorney advice card. |
| **Deliverables** | Client Final Report & PDF | ⏳ 70% | UI exists; needs live MongoDB report wiring and PDF generator (Next sprint). |

---

## 🛠️ 3. Accomplishments in the Current Sprint

1. **Live AI Clause Analysis & Flagging Connected**:
   * Replaced static mock data (`Contract_0417.pdf`) with live MongoDB Atlas flags.
   * Clause text, AI rationales, and Philippine statutory citations load in real-time.
2. **Attorney Safety & Modern UI/UX Controls**:
   * **Multi-Level Override Popover**: Anchored dropdown allowing classification into *Clear (Low)*, *Medium-Risk*, or *High-Risk*.
   * **Instant "↺ Reset to AI"**: Accident protection button that immediately restores the original AI assessment.
   * **Dedicated Attorney Personal Note Card**: Prominent section allowing counsel to add tailored renegotiation guidance for the client.
   * **Clause Isolation**: Added unique component keying to prevent state leakage across different clauses.
   * **Modern Review Checkmarks**: Subtle subtitle status pills (`✓ Reviewed` / `✓ Overridden`) replacing raw characters.
3. **Queue Workflow & Database Cleanup**:
   * Cleaned up automated test contracts (`Automated Test Software Engineer Agreement`, etc.).
   * Updated attorney database profile to **Atty. Jimenez** (`IBP Roll No. 67890`).
   * Enhanced `GET /api/attorney/queue` to preserve completed contracts with `APPROVED / COMPLETED` badges.
   * Fixed table header contrast with solid `#ECE5D6` parchment bar and double-strength border.

---

## 🔮 4. Next Recommended Steps (Final Sprint to 100%)

1. **Wire the Client Final Report Page (`ContractReportPage.tsx`)**:
   * Fetch live completed contract data and Atty. Jimenez's approved flags and custom advice notes.
   * Add a **"Recommended Next Steps / Action Plan"** card for the client at the bottom.
2. **Add "View Report" CTA on Track Status Stepper (`TrackStatusPage.tsx`)**:
   * When Stage 05 (Completed) is reached, display a prominent celebratory banner:  
     `[ View Final Verified Report → ]`.
3. **Implement PDF Report Generator**:
   * Export an official printable **Philippine Legal Advisory Report** with firm header, verified stamp, and risk breakdown.
4. **Connect Statutory Corpus Browser (`StatutoryCorpusPage.tsx`)**:
   * Wire the search bar and table to `GET /api/knowledge-base/sources` and `POST /api/knowledge-base/sources`.

---

## 🏃 5. How to Run the Project Locally

### Prerequisites
* Node.js v18+
* MongoDB Atlas Connection (`MONGO_URI` in `server/.env`)

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
* **Managing Attorney:** `attorney@lingkodbatas.ph` / `Password123!` (Atty. Jimenez)
* **Client User:** Create any new client account at `/register` or login with your client credentials.

---

*Report prepared for ZamSP31 and the Lingkod Batas Capstone Team.*
