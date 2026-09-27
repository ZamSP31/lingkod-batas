import type { ChatMessage } from "../types/chatbot.js";

export const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: "msg-0",
  sender: "bot",
  text: "Hello! I am the Lingkod Batas Assistant. I can help you explore the platform (submitting contracts, tracking review status, viewing compliance reports) or answer questions about Philippine labor laws. What would you like to know?",
};

interface CannedReply {
  keywords: string[];
  reply: string;
}

/**
 * Placeholder matcher standing in for a real chatbot backend. Swap
 * getMockBotReply's call site for a real POST /api/chatbot/message
 * once that endpoint exists — this keeps the widget interactive
 * during frontend-only development in the meantime.
 */
const CANNED_REPLIES: CannedReply[] = [
  {
    keywords: [
      "tutorial",
      "how does this work",
      "how it works",
      "guide",
      "walkthrough",
      "step by step",
      "getting started",
    ],
    reply:
      "Welcome to Lingkod Batas! Here is how to use the platform in 4 simple steps:\n\n1. SUBMIT: Click 'Submit Contract', choose your contract type (Regular, Probationary, Project-Based, or Fixed-Term), and upload your file (PDF, PNG, or JPG up to 20MB).\n2. AUTOMATED AUDIT: Our engine masks personal information (RA 10173) and cross-references clauses against Labor Code articles.\n3. ATTORNEY REVIEW: A licensed lawyer personally examines every flagged clause and verifies compliance.\n4. VIEW & DOWNLOAD: Track progress in real-time, then view your detailed compliance report and download the PDF once approved.",
  },
  {
    keywords: [
      "submit",
      "upload",
      "how to upload",
      "how to submit",
      "file size",
    ],
    reply:
      "To submit an employment contract for compliance review:\n\n1. Navigate to 'Submit Contract' from the left sidebar.\n2. Select the contract classification: Regular, Probationary, Project-Based, or Fixed-Term.\n3. Enter the Employer / Company Name and Contract Title.\n4. Drag & drop or browse your document (PDF, PNG, or JPG up to 20MB).\n5. Click 'Submit for Review'.\n\nAutomatic PII Sanitization (RA 10173) will immediately mask personal identities, and you'll receive a unique Request Number (e.g., LB-2026-0001).",
  },
  {
    keywords: [
      "track",
      "status",
      "progress",
      "pipeline",
      "where is my contract",
    ],
    reply:
      "You can monitor your contract's progress at any time:\n\n1. Click 'Track Status' in the left sidebar.\n2. Active submissions move through 5 stages:\n   • Step 1: Contract Submitted\n   • Step 2: OCR & Clause Segmentation (PII sanitized)\n   • Step 3: Statutory Audit & AI Risk Flagging\n   • Step 4: Attorney Legal Review (Licensed lawyer validates findings)\n   • Step 5: Completed & Released\n\nYou will also receive notification alerts whenever your contract advances to a new stage.",
  },
  {
    keywords: ["report", "download", "pdf", "view report", "results"],
    reply:
      "Once a contract has been reviewed and released by the attorney:\n\n1. Go to 'My Contracts' or 'Track Status'.\n2. When status displays 'Completed', click 'View Report'.\n3. The report displays:\n   • Overall Risk Assessment (Low, Medium, or High Risk)\n   • Clause-by-Clause Labor Code Audit\n   • Attorney Review Notes & Legal Recommendations\n4. Click 'Download PDF' to save an official, printable report.",
  },
  {
    keywords: [
      "privacy",
      "pii",
      "safe",
      "security",
      "data retention",
      "confidential",
    ],
    reply:
      "Your privacy is protected under Republic Act 10173 (Data Privacy Act of 2012):\n\n• Automatic Name & PII Redaction: All personal names, addresses, ID numbers, and contact details in contracts are masked to '[REDACTED_NAME]' prior to analysis.\n• Zero PII Retention: We do not store or build personal profiles from contract contents; only basic login credentials are saved.\n• Role-Based Access: Only you and the assigned licensed attorney can access your contract.",
  },
  {
    keywords: ["attorney", "lawyer", "who reviews", "human in the loop"],
    reply:
      "Lingkod Batas enforces strict Human-in-the-Loop Attorney Gatekeeping (Rule 4):\n\nAI generates preliminary clause flags, but every single flag must be reviewed, adjusted, and approved by a licensed Philippine attorney before any report is released to the client.",
  },
  {
    keywords: ["supported", "contract type", "contract types", "what contract"],
    reply:
      "Lingkod Batas evaluates four (4) canonical Philippine employment contract classifications:\n1. Regular Employment (indefinite tenure, security of tenure)\n2. Probationary Employment (strictly capped at 6 months)\n3. Project-Based Employment (tied to specific project scope)\n4. Fixed-Term Employment (voluntarily agreed with definite duration)",
  },
  {
    keywords: ["legal", "clause", "risk", "illegal", "terminat"],
    reply:
      "I can explain general Labor Code principles (e.g. Art. 296 on probation or Art. 113 on deductions), but I cannot provide case-specific dispute strategy or legal advice. That is provided by your assigned attorney in the contract report.",
  },
];

const FALLBACK_REPLY =
  "I am the Lingkod Batas Assistant! You can ask me how to upload contracts, how to track status, how the attorney review pipeline works, data privacy rules (RA 10173), or Philippine Labor Code standards (overtime, probation, wage deductions, 13th month).";

export function getMockBotReply(userMessage: string): string {
  const normalized = userMessage.toLowerCase();
  const match = CANNED_REPLIES.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.reply ?? FALLBACK_REPLY;
}
