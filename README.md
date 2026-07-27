# Lingkod Batas

**An AI-Powered Contract Checker for Unfair Employment Clauses**

A RAG-grounded, Explainable AI (XAI) web system that assists Philippine freelance and solo-practice lawyers with attorney-supervised contract risk review for vendor, employment, and service agreements.

Clients upload contracts; the system flags potentially risky clauses using retrieval-augmented generation grounded in the Philippine Labor Code and DOLE issuances. Only the reviewing attorney sees the AI-generated analysis — the attorney validates, overrides, or approves flags before a report is released.

---

## Team

| Name | Role |
|---|---|
| Alyzah Zamuelle "Az" San Pablo | Back-end Lead Developer |
| Heather Ryann Abon | Front-end Lead Developer |
| Sophia Alexandra Sargento | Documentation Lead / Group Leader |
| Rc Tayuan | Technical Adviser |

Team roles rotate across Development Team, Scrum Master, and Product Owner each sprint. A Domain-Validating Attorney joins sprint reviews.

**Course context:** BS Information Technology (Web and Mobile Development), University of Santo Tomas — Department of Information Technology, Institute of Information and Computing Sciences.

**Timeline:** Capstone 1 started June 9, 2026 (no gap into Capstone 2, which runs through December 2026). Scrum methodology, 2-week sprints.

---

## Tech Stack

**Frontend:** React.js, TypeScript, Material UI
**Backend:** Node.js, Express
**Database:** MongoDB (via MongoDB Atlas)
**AI / RAG pipeline:** LlamaIndex, BAAI bge-m3 embeddings, Chroma vector store
**LLM:** OpenAI GPT-4.1 Mini (primary), Claude API (alternative)
**OCR:** Tesseract.js (primary), with a planned fallback to a cloud OCR service when Tesseract confidence is low, and manual attorney flagging if confidence stays low after fallback
**Auth:** JWT
**File storage:** Cloudinary
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

**Repo structure (monorepo):**
\`\`\`
lingkod-batas/
├── client/     ← React + TypeScript frontend
├── server/     ← Node.js + Express backend
└── README.md
\`\`\`

---

## User Roles

- **Client** — uploads contracts for review, tracks status, views the final report once approved
- **Attorney (Domain Validator)** — admin-created account (not self-registered); reviews AI-flagged clauses, can override AI recommendations, approves reports for release

---

## Core Features (Functional Requirements)

- Login / Register (Client only) / Forgot Password / Manage Profile
- Role-specific Dashboard (Client / Attorney)
- Submit Employment Contract (PDF/PNG/JPEG, generates a unique request number)
- Track Contract Review Status (OCR Processing → AI Analysis → Awaiting Attorney Review → Under Review → Completed)
- View Contract Analysis Report (downloadable, post-approval PDF)
- Manage Contract Review Requests (attorney can override AI recommendations)
- View AI Contract Analysis (OCR + RAG + XAI, cites Philippine Labor Code and DOLE issuances)
- Manage Knowledge Base (Labor Code, DOLE Department Orders, other labor regulations)
- Notifications (real-time, client and attorney)
- FAQ Chatbot (predefined informational responses only — no legal advice)
- Audit Logs (submissions, AI analyses, approvals, report generation, account actions)

**Sprint grouping:**
- **Must-Have:** Login & Registration; Document Ingestion & OCR; Automated Risk Analysis (RAG pipeline, clause segmentation & classification); Attorney Dashboard (validate & curate risk flags)
- **Should-Have:** Manage Statutory Source Corpus / system admin tools; View Analyzed Contracts & Risk Profiles
- **Testing:** Continuous testing during sprint reviews; final UAT with target lawyers

---

## Project Background

Lingkod Batas underwent a significant structural pivot away from an original kasambahay/domestic-worker framing, advised by the professor due to a scope-problem mismatch and lack of legal domain validation. A second pivot followed panel-defense feedback: the system is now client-facing for uploads, with results visible only to the reviewing attorney. The core technical architecture (OCR ingestion → RAG → XAI → clause classification) was preserved through both pivots.

---

## Open Issues Flagged for the Panel

- No named host organization or attorney interview yet (missing primary evidence source)
- Accuracy/evaluation metrics not yet defined
- Data privacy handling under RA 10173 (Data Privacy Act) not yet resolved
- Capstone 1 vs. Capstone 2 feature split not yet formalized
- Domain-validating attorney's credentials not yet named

**Panel feedback to address in design:**
1. Keep plain-English rationales clear and legally defensible, with safeguards against overly broad statutory citations, and a way for the attorney to quickly verify each explanation
2. Guarantee every flagged clause has a clear, citable statutory rationale without overgeneralizing
3. Handle ambiguous or multi-layered clauses that could fall into more than one risk category
4. Minimize OCR errors, especially for scanned contracts with poor quality or handwritten annotations

---

## Coding Conventions

**Frontend (`client/src/`):**
\`\`\`
components/   reusable UI pieces
pages/        route-level views
services/     API calls — components never call fetch/axios directly
hooks/        custom React hooks
types/        TypeScript interfaces/types
context/      auth state, global state
utils/        helper functions
\`\`\`

**Backend (`server/src/`):**
\`\`\`
routes/       route definitions only
controllers/  request handling logic
models/       MongoDB schemas
services/     business logic (RAG pipeline, OCR, etc.)
middleware/   auth, error handling
config/       DB connection, env setup
\`\`\`

**Rules:**
- Routes stay thin → controllers stay thin → logic lives in services
- One component/function per file, named to match the file
- `camelCase` for functions/variables, `PascalCase` for components/types
- TypeScript strict mode on
- ESLint + Prettier enforced (format-on-save, pre-commit via husky/lint-staged)
- PRs require at least one teammate review before merging to `main`

---

## Getting Started

\`\`\`bash
git clone https://github.com/<org-or-user>/lingkod-batas.git
cd lingkod-batas

# Frontend
cd client
npm install
npm run dev

# Backend (separate terminal)
cd server
npm install
npm run dev
\`\`\`

Environment variables (see `.env.example` in each of `client/` and `server/`) are required for MongoDB Atlas, JWT secret, Cloudinary, and LLM API keys.
