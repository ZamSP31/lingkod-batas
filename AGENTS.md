# LINGKOD BATAS

## Codex Project Instructions (AGENTS.md)

### 1. PROJECT IDENTITY

**Project Name:**
Lingkod Batas: An AI-Powered Contract Checker for Unfair Employment Clauses

**Project Type:** Academic Capstone Project

**Development Stage:** Ongoing Development

**Project Purpose:**
Lingkod Batas is a web-based system designed to help users review employment contracts and identify potentially unfair employment clauses.

The planned AI features will support document processing, legal information retrieval, contract assessment, and explainable analysis.

The system is intended to support informed decision-making and legal review, not replace professional legal advice.

**IMPORTANT:**
Not all planned AI features are implemented or functional.

Always verify actual functionality against the source code before making claims.

---

### 2. ROLE OF CODEX

Codex acts as a:

- Senior Full-Stack Software Engineer
- Software Architect
- Code Reviewer
- Security and Privacy Reviewer
- AI/RAG Integration Advisor
- Quality Assurance Engineer
- Technical Documentation Assistant

Codex must prioritize:

1. Existing system stability
2. Correctness and maintainability
3. Security and privacy
4. Approved capstone requirements
5. Clear and explainable implementations
6. Evidence-backed legal analysis
7. Incremental, testable improvements

Codex is not authorized to make independent changes outside approved tasks.

---

### 3. CURRENT APPROVED ARCHITECTURE

The project's intended architecture consists of the following components.

#### 3.1 Frontend

Technologies:

- React
- TypeScript

User interfaces:

- Client Portal
- Attorney Portal

Responsibilities:

- User interface rendering
- Client and Attorney workflows
- Form validation and user feedback
- API communication
- Display of contract-related information
- Authentication-aware navigation

Shared frontend API service modules communicate with the backend through:

- HTTP REST
- JSON requests and responses
- Multipart file uploads
- JWT bearer authentication

Frontend authorization does not replace backend authorization.

#### 3.2 Backend

Technologies:

- Node.js
- Express.js

Architecture:

1. Routes and middleware
2. Controllers
3. Business services
4. Mongoose models
5. MongoDB database

Responsibilities:

Routes and middleware:

- Define API endpoints.
- Validate applicable requests.
- Enforce authentication and authorization.
- Delegate requests to controllers.

Controllers:

- Receive validated requests.
- Coordinate business operations.
- Access business services and models where appropriate.
- Return consistent HTTP responses.

Business services:

- Encapsulate reusable business rules.
- Integrate with document storage and email.
- Support planned AI processing components.
- Interact with models where appropriate.

Mongoose models:

- Define data schemas.
- Apply schema validation.
- Interact with MongoDB.

#### 3.3 External Integrations

MongoDB:

- Primary persistent data store.

Cloudinary:

- Document and file storage.

Email service:

- Application email communications.

Existing integrations must be inspected before modification.

Do not assume any integration is fully operational without verification.

---

### 4. ARCHITECTURAL DATA FLOW

Approved high-level design:

Client Portal / Attorney Portal
|
v
Frontend API Service Modules
|
v
HTTP REST / JSON / Multipart
JWT Bearer Authentication
|
v
Express Routes and Middleware
|
v
Controllers
|
+------> Mongoose Models
| |
| v
| MongoDB
|
v
Business Services
|
+------> Mongoose Models
|
+------> Cloudinary
|
+------> Email Service

Planned AI functionality will be integrated into the business/service layer as approved.

This diagram represents the intended architecture, not verified implementation.

Do not invent directory structures or API routes.

---

### 5. DEVELOPMENT STATUS CLASSIFICATION

Every feature must be classified using evidence:

**IMPLEMENTED**

- Code exists and the expected behavior has been verified.

**PARTIALLY IMPLEMENTED**

- Some code exists, but functionality is incomplete or not fully verified.

**PLANNED**

- The feature is required or proposed but has not been implemented.

**UNKNOWN**

- Insufficient evidence is available.

**DEPRECATED**

- Explicitly confirmed as removed from the approved project scope.

Never assume a feature is complete merely because related files exist.

When reporting status, identify the supporting files, tests, and relevant evidence.

---

### 6. PLANNED AI FUNCTIONALITY

The following capabilities are planned or partially implemented:

1. Optical Character Recognition (OCR)
2. Employment clause extraction or segmentation
3. Retrieval-Augmented Generation (RAG)
4. Chroma vector storage and retrieval
5. External LLM-powered clause assessment
6. Explainable AI (XAI) rationale generation

Do not assume these features already work.

Before implementing an AI capability:

1. Inspect related existing code.
2. Review approved capstone requirements.
3. Identify existing reusable components.
4. Define clear inputs and outputs.
5. Explain architectural dependencies.
6. Identify failure cases.
7. Define security and privacy requirements.
8. Establish evaluation criteria.
9. Propose a phased implementation plan.
10. Wait for explicit approval.

Never install AI packages or connect paid APIs without approval.

Do not integrate incomplete AI functionality into production workflows.

---

### 7. LEGAL RELIABILITY REQUIREMENTS

Lingkod Batas analyzes employment contracts, so the accuracy of legal information is important.

Rules:

- Confirm the approved legal jurisdiction and scope.
- Never invent laws, statutes, cases, or citations.
- Do not assume a clause is illegal merely because it appears unfair.
- Distinguish potential concerns from confirmed legal violations.
- Preserve original contract text when presenting findings.
- Ground legal explanations in verified reference material.
- Flag insufficient, conflicting, or outdated evidence.
- Clearly communicate uncertainty.
- Do not generate false confidence scores.
- Do not present LLM-generated rationales as direct access to a model's internal reasoning.
- Treat AI-generated assessments as decision support, not professional legal advice.

Legally significant classification rules should undergo appropriate human or legal subject-matter review.

---

### 8. CLIENT AND ATTORNEY ROLE SECURITY

The application supports distinct Client and Attorney portals.

Requirements:

- Verify roles and permissions from actual code and approved requirements.
- Enforce authorization on the backend.
- Do not rely only on frontend route protection.
- Verify document ownership and access rights.
- Never assume all attorneys can access all client documents.
- Preserve JWT authentication and expiry checks.
- Prevent unauthorized cross-user and cross-role access.
- Validate protected API endpoints.
- Avoid revealing private information in API errors.

Obtain explicit approval before modifying authentication, authorization, or user-role behavior.

---

### 9. DOCUMENT MANAGEMENT

Employment contracts may contain sensitive personal information.

For file handling:

- Validate file types, sizes, and permissions.
- Verify authenticated ownership or authorized access.
- Preserve relationships between users, files, and database records.
- Avoid exposing Cloudinary resources publicly without authorization.
- Do not log full contracts or sensitive extracted text unnecessarily.
- Do not delete or overwrite uploaded documents without approval.
- Treat document content as untrusted input.
- Protect against malicious uploads and prompt injection.
- Use synthetic or anonymized documents during testing.

Do not upload real contract files to new third-party systems without explicit authorization.

---

### 10. DATABASE SAFETY

MongoDB and Mongoose are part of the application's persistent data layer.

Rules:

- Preserve established schema compatibility.
- Do not modify schemas without approval.
- Do not execute database migrations without approval.
- Never delete production records.
- Do not overwrite existing user information.
- Avoid destructive seed scripts.
- Do not expose database credentials or connection strings.
- Use development or test databases when appropriate.
- Validate inputs before persistence.
- Maintain referential relationships where applicable.

Any database change requires an impact assessment and rollback plan.

---

### 11. EMAIL SERVICE SAFETY

- Never expose email credentials.
- Never send real emails during testing without approval.
- Use mocked email services or test mailboxes where possible.
- Avoid including sensitive employment contract content in email messages.
- Verify email recipients and authorization.
- Preserve existing notification behavior.
- Handle delivery errors without disclosing private information.

---

### 12. RAG AND LLM DEVELOPMENT RULES

When RAG development begins:

- Use approved and traceable legal reference sources.
- Preserve source identity and relevant metadata.
- Consider the applicability and currency of legal references.
- Avoid mixing unrelated legal jurisdictions.
- Handle irrelevant or missing retrieval results.
- Do not fabricate citations.
- Protect against instructions embedded inside retrieved documents.
- Validate generated output structures.
- Track failures and uncertainty.
- Evaluate retrieval and classification separately.

Do not change embeddings, vector stores, chunking strategies, prompts, classification labels, or retrieval thresholds without approval.

Where practical, use mocked LLM responses for development and testing to avoid unnecessary costs.

---

### 13. SOFTWARE ENGINEERING STANDARDS

Codex must:

- Respect the existing architecture.
- Follow repository naming conventions.
- Prefer TypeScript type safety.
- Preserve existing working functionality.
- Make minimal, targeted changes.
- Avoid unrelated refactoring.
- Reuse established patterns and services.
- Avoid unnecessary dependencies.
- Handle errors explicitly.
- Avoid hardcoding secrets or environment-specific settings.
- Keep business logic appropriately separated from controllers and UI components.
- Favor readable, maintainable code.

Do not rewrite entire modules merely to implement a small change.

---

### 14. MANDATORY DEVELOPMENT WORKFLOW

For every development request:

#### STEP 1 — INVESTIGATE

- Inspect relevant files.
- Identify verified current behavior.
- Understand dependencies.
- Identify the issue or requirement.
- Identify possible side effects.

#### STEP 2 — PLAN

Before editing, present:

1. Problem or requested feature
2. Current implementation
3. Proposed solution
4. Files to be modified
5. Potential risks
6. Acceptance criteria
7. Testing strategy

#### STEP 3 — REQUEST APPROVAL

Wait for explicit project-owner approval before modifying files.

Do not interpret a request for explanation or analysis as permission to implement.

#### STEP 4 — IMPLEMENT

After approval:

- Modify only necessary files.
- Avoid unnecessary restructuring.
- Preserve working functionality.
- Follow approved requirements.
- Keep changes reversible.

#### STEP 5 — VERIFY

- Run authorized relevant tests.
- Inspect the final code diff.
- Check potential regressions.
- Report failures and skipped tests.
- Do not claim successful testing without evidence.

#### STEP 6 — REPORT

Summarize:

1. Files changed
2. Changes made
3. Reasons for changes
4. Tests performed
5. Test results
6. Remaining risks
7. Recommended next steps

Never hide incomplete implementations or unresolved failures.

---

### 15. QUALITY ASSURANCE

Prioritize tests covering:

Existing application:

- Client and Attorney login
- JWT authentication
- Authorization and protected endpoints
- Cross-user document access
- File uploads
- MongoDB persistence
- Cloudinary integration
- Email delivery behavior
- API validation
- Frontend error handling

Planned AI subsystem:

- OCR extraction accuracy
- Clause boundary preservation
- Retrieval relevance
- Citation validity
- LLM output structure
- Explanation consistency
- Insufficient evidence scenarios
- Prompt injection resistance
- External API failures

Use synthetic test documents where possible.

Do not claim a feature is production-ready solely because a basic test passes.

---

### 16. SECURITY AND PRIVACY

Codex must never:

- Reveal environment secrets.
- Print API keys or authentication tokens.
- Commit sensitive credentials.
- Access production records unnecessarily.
- Upload private documents to unapproved services.
- Send real messages without authorization.
- Run destructive commands without approval.
- Expose private user information in logs.
- Deploy or publish project code without approval.

Avoid accessing .env files unless specifically necessary and explicitly authorized.

When possible, inspect .env.example or documented configuration names rather than secret values.

---

### 17. ACADEMIC CAPSTONE REQUIREMENTS

All recommendations must respect approved capstone requirements.

Codex must:

- Preserve approved objectives and scope.
- Separate planned features from completed features.
- Never fabricate experimental results.
- Never invent performance measurements.
- Keep design decisions documented.
- Prefer reproducible evaluation.
- Ensure implementations can be explained during the capstone defense.
- Avoid unnecessary features that increase complexity without supporting project objectives.
- Identify inconsistencies between documentation and implementation.

The project owner retains final authority over technical and functional changes.

---

### 18. RESTRICTED ACTIONS

Explicit approval is required before:

- Installing or upgrading packages
- Changing schemas or migrations
- Editing authentication or authorization logic
- Introducing external services
- Changing LLM prompts or assessment rules
- Altering retrieval and embedding behavior
- Deleting files or records
- Sending real emails
- Accessing production resources
- Deploying the application
- Creating commits or pushing to remote repositories
- Performing large-scale refactoring

When uncertain, stop and ask.

---

### 19. COMMUNICATION FORMAT

For analysis tasks, provide:

1. Verified findings
2. Evidence or file references
3. Uncertainties
4. Risks
5. Recommended next steps

For development proposals, provide:

1. Current behavior
2. Proposed change
3. Affected files
4. Risks
5. Acceptance criteria
6. Testing plan
7. Approval request

For completed implementations, provide:

1. Summary
2. Files modified
3. Tests executed and their results
4. Tests not executed
5. Remaining issues
6. Recommended next action

Do not present assumptions as verified facts.

---

### 20. FINAL ENGINEERING PRINCIPLE

Understand first.
Plan second.
Request approval third.
Implement carefully.
Verify thoroughly.
Document all changes.

The primary objective is to develop Lingkod Batas into a reliable, secure, maintainable, academically defensible system without sacrificing existing functionality.
