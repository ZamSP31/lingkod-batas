const asyncHandler = require("express-async-handler");
const StatutorySource = require("../models/StatutorySource");
const { classifyQuestion, legalTopics, questionRequirements } = require("../utils/chatbotScope");

/**
 * Rule 6 (FAQ Guardrails): Intent classifier patterns for intercepting case-specific legal advice.
 */
const LEGAL_ADVICE_TRIGGERS = [
  /\b(pwede|puwede|maaari) ba (?:akong|ako|kong) (?:magdemanda|kasuhan|idemanda|pumirma)\b/i,
  /\b(ano ang dapat kong gawin|gumawa ng kontrata para sa akin)\b/i,
  /\b(should\s+i\s+sign|can\s+i\s+sue|can\s+my\s+employer\s+sue\s+me)\b/i,
  /\b(is\s+my\s+(?:boss|employer|company)\s+allowed\s+to\s+fire\s+me)\b/i,
  /\b(what\s+should\s+i\s+do\s+(?:if|about|with\s+my))\b/i,
  /\b(am\s+i\s+entitled\s+to\s+sue|give\s+me\s+legal\s+advice)\b/i,
  /\b(can\s+you\s+review\s+this\s+specific\s+clause|represent\s+me)\b/i,
  /\b(draft\s+me\s+a\s+contract|write\s+a\s+clause\s+for\s+me)\b/i,
  /\b(help\s+me\s+file\s+a\s+case|nlrc\s+complaint\s+filing)\b/i,
];

const INFORMATION_NOTICE = "General information only - not legal advice. Corpus excerpts may not address every exception or your individual circumstances. Consult your reviewing attorney for a case-specific assessment.";

const DISCLAIMER_REPLY =
  "NOTICE & LEGAL DISCLAIMER: As an informational AI assistant grounded in Philippine labor statutes, I can provide factual information regarding the Labor Code of the Philippines and DOLE regulations, but I am legally and architecturally restricted from giving specific legal counsel, dispute strategies, or contract drafting assistance. For legal advice regarding your individual case, please consult your assigned reviewing attorney or submit your contract for attorney-supervised review.";

/**
 * Platform exploration & navigation guides helping users understand and navigate Lingkod Batas.
 */
const PLATFORM_GUIDES = [
  {
    topic: "upload_and_submit",
    keywords: [
      "upload",
      "submit",
      "send contract",
      "attach",
      "how to upload",
      "how to submit",
      "file size",
      "file format",
      "document format",
      "uploading",
    ],
    title: "How to Submit & Upload an Employment Contract",
    text:
      "To submit an employment contract for compliance review:\n\n" +
      "1. Navigate to 'Submit Contract' from the left sidebar.\n" +
      "2. Select the contract classification: Regular, Probationary, Project-Based, or Fixed-Term.\n" +
      "3. Enter the Employer / Company Name and your Contract Title.\n" +
      "4. Drag and drop or browse to upload your document (PDF, PNG, or JPG up to 20MB).\n" +
      "5. Click 'Submit for Review'.\n\n" +
      "What happens next:\n" +
      "• Automatic PII Sanitization (RA 10173) redacts sensitive names and credentials before analysis.\n" +
      "• You will receive a unique tracking Request Number (e.g., LB-2026-0001).\n" +
      "• The contract proceeds to AI clause screening and attorney review.",
  },
  {
    topic: "track_status_pipeline",
    keywords: [
      "track",
      "status",
      "pipeline",
      "where is my contract",
      "progress",
      "how long",
      "processing",
      "tracking",
      "check status",
    ],
    title: "How to Track Contract Review Status",
    text:
      "You can monitor your contract's progress at any time:\n\n" +
      "1. Click 'Track Status' in the left sidebar.\n" +
      "2. You'll see your active submissions with their live stage in the review pipeline:\n" +
      "   • Step 1: Contract Submitted (Received & queued)\n" +
      "   • Step 2: OCR & Clause Segmentation (AI extracts text & redacts PII)\n" +
      "   • Step 3: Statutory Audit & AI Risk Flagging (Cross-referenced with Labor Code)\n" +
      "   • Step 4: Attorney Legal Review (Licensed lawyer validates or adjusts findings)\n" +
      "   • Step 5: Completed & Released (Final verified compliance report ready)\n\n" +
      "You will also receive notification alerts whenever your contract advances to a new stage.",
  },
  {
    topic: "view_and_download_report",
    keywords: [
      "report",
      "download",
      "view report",
      "certificate",
      "results",
      "pdf report",
      "compliance report",
      "how to see report",
      "get report",
    ],
    title: "How to View & Download Your Compliance Report",
    text:
      "Once a contract has been reviewed and released by the attorney:\n\n" +
      "1. Go to 'My Contracts' or 'Track Status'.\n" +
      "2. When status displays 'Completed', click the 'View Report' button.\n" +
      "3. The report displays:\n" +
      "   • Overall Risk Assessment (Low, Medium, or High Risk)\n" +
      "   • Clause-by-Clause Audit with Philippine Labor Code citations\n" +
      "   • Flagged Discrepancies (e.g. prohibited deductions, excessive probation)\n" +
      "   • Attorney Review Notes & Legal Recommendations\n" +
      "4. Click 'Download PDF' to save an official, printable copy of the report.",
  },
  {
    topic: "attorney_review_role",
    keywords: [
      "attorney",
      "lawyer",
      "who reviews",
      "human in the loop",
      "human review",
      "gatekeeping",
      "review process",
      "attorney review",
    ],
    title: "How Attorney Review Works (Human-in-the-Loop)",
    text:
      "Lingkod Batas enforces strict Human-in-the-Loop Attorney Gatekeeping (Rule 4):\n\n" +
      "• AI does NOT directly release compliance verdicts to clients.\n" +
      "• Every automated flag generated during clause extraction is queued for a licensed Philippine attorney.\n" +
      "• The attorney verifies factual accuracy, adjusts severity levels (Compliant, Caution, Non-Compliant), writes legal reasoning notes, and explicitly signs off before the report is released.\n" +
      "This guarantees ethical compliance and professional legal accountability.",
  },
  {
    topic: "privacy_and_pii",
    keywords: [
      "privacy",
      "pii",
      "data privacy",
      "confidential",
      "safe",
      "security",
      "data retention",
      "delete",
      "retain",
      "retention",
    ],
    title: "Data Privacy & PII Protection (RA 10173 Compliance)",
    text:
      "Your privacy is protected under the Philippine Data Privacy Act of 2012 (RA 10173):\n\n" +
      "• Automatic Name & PII Redaction: When contracts are uploaded, all personal names, addresses, ID numbers, and contact details are masked into '[REDACTED_NAME]' prior to analysis.\n" +
      "• Zero PII Retention: The system does NOT retain personal contract data or build personal profiles. Only your essential user account credentials (email and role) are stored for authentication.\n" +
      "• Secure Access: Only you and your assigned attorney can view your submission.",
  },
  {
    topic: "platform_overview_features",
    keywords: [
      "explore",
      "features",
      "what can i do",
      "what does this do",
      "about lingkod batas",
      "what is lingkod batas",
      "overview",
      "capabilities",
      "system",
      "grasp",
    ],
    title: "Exploring Lingkod Batas Platform Features",
    text:
      "Lingkod Batas is an AI-assisted legal compliance platform built for Philippine workers, freelancers, and solo legal practitioners:\n\n" +
      "Key Features you can explore:\n" +
      "1. Submit Contract: Upload employment contracts for automated Labor Code clause audits.\n" +
      "2. Track Status: Live milestone tracker showing contract progress through OCR, AI audit, and attorney sign-off.\n" +
      "3. Compliance Reports: Detailed reports with risk levels, Labor Code citations, and attorney notes.\n" +
      "4. Labor Law Knowledge Assistant: Ask questions anytime about overtime, probation, termination, or wage deductions.\n" +
      "5. PII Redaction (RA 10173): Automatic sanitization to ensure sensitive employee/employer identities remain confidential.",
  },
  {
    topic: "platform_tutorial",
    keywords: [
      "tutorial",
      "how does this work",
      "how it works",
      "guide",
      "walkthrough",
      "step by step",
      "getting started",
      "help",
      "instructions",
    ],
    title: "Quick-Start Platform Tutorial (4 Steps)",
    text:
      "Welcome to Lingkod Batas! Here is how to get started in 4 simple steps:\n\n" +
      "1. SUBMIT: Click 'Submit Contract', choose your contract type (Regular, Probationary, Project-Based, or Fixed-Term), and upload your file (PDF, PNG, JPG up to 20MB).\n" +
      "2. AUTOMATED AUDIT: Our engine masks personal information (RA 10173) and cross-references clauses against Labor Code articles.\n" +
      "3. ATTORNEY REVIEW: A licensed lawyer personally examines every flagged clause and verifies compliance.\n" +
      "4. VIEW & DOWNLOAD: Track progress in real-time, then view your detailed compliance report and download the PDF once approved.",
  },
  {
    topic: "supported_contracts",
    keywords: [
      "supported contract",
      "contract type",
      "contract types",
      "what contract",
      "which contract",
    ],
    title: "Supported Employment Contract Classifications",
    text:
      "Lingkod Batas supports four (4) canonical Philippine employment contract classifications:\n\n" +
      "1. Regular Employment: Indefinite tenure performing activities necessary or desirable in the employer's usual business (Labor Code Art. 295).\n" +
      "2. Probationary Employment: Trial period strictly capped at six (6) months, requiring clear standards established at engagement (Art. 296).\n" +
      "3. Project-Based Employment: Employment tied to a specific project with pre-determined scope and duration (Art. 295).\n" +
      "4. Fixed-Term Employment: Voluntarily entered agreement with a definite term, without employer dominance (Brent School ruling).",
  },
];

/**
 * POST /api/chatbot/message
 * Grounded RAG FAQ assistant answering Philippine Labor Law queries with Rule 6 Intent Guardrails.
 */
const handleChatbotMessage = asyncHandler(async (req, res) => {
  if (typeof req.body.message !== "string" || req.body.message.length > 2000) {
    res.status(400);
    throw new Error("Enter a question of up to 2000 characters.");
  }
  const message = req.body.message.trim();

  if (!message) {
    res.status(400);
    throw new Error("Message content is required.");
  }

  // 1. Rule 6 Intent Scoping: Intercept requests for specific legal advice or drafting
  const requiresDisclaimer = LEGAL_ADVICE_TRIGGERS.some((pattern) =>
    pattern.test(message),
  );

  if (requiresDisclaimer) {
    return res.status(200).json({
      reply: DISCLAIMER_REPLY,
      source: null,
      isDisclaimer: true,
    });
  }

  const scope = classifyQuestion(message);
  if (scope.kind === "platform") {
    const guide = PLATFORM_GUIDES.find((item) => item.topic === scope.topic);
    const notice = ["supported_contracts", "privacy_and_pii"].includes(scope.topic) ? INFORMATION_NOTICE : null;
    return res.status(200).json({ reply: `${guide.title.toUpperCase()}\n\n${guide.text}${notice ? `\n\n${notice}` : ""}`,
      ...(notice ? { disclaimer: notice } : {}),
      source: { citation: "Lingkod Batas Platform Navigation & Workflow", title: guide.title }, isDisclaimer: false });
  }
  if (scope.kind === "out_of_scope") {
    return res.status(200).json({ reply: "I can help with Lingkod Batas workflows and supported Philippine employment-law topics. Please ask a question within that scope.",
      source: null, isDisclaimer: false, scope: "out_of_scope" });
  }
  const requirements = questionRequirements(message);
  let retrievedStatute = null;
  try {
    const searchTerms = scope.topics.map((topic) => topic.search).join(" ");
    const matches = await StatutorySource.find({ isActive: true, $text: { $search: searchTerms } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } }).limit(5);
    const source = matches.find((item) => {
      const covered = legalTopics(`${item.title} ${item.provisionText}`).map((topic) => topic.id);
      return item.citation && item.provisionText && scope.topics.every((topic) => covered.includes(topic.id)) && requirements.every((requirement) => requirement.source.test(item.provisionText));
    });
    if (source) retrievedStatute = { citation: source.citation, title: source.title, text: source.provisionText };
  } catch {
    return res.status(200).json({ reply: "The statutory corpus is temporarily unavailable. I cannot verify an answer right now. Please try again later or consult your reviewing attorney.",
      source: null, isDisclaimer: false, scope: "retrieval_failed" });
  }

  // 5. Synthesize educational statutory response
  if (retrievedStatute) {
    const responseText = [
      `Related corpus excerpt (${retrievedStatute.citation}):`,
      "",
      `"${retrievedStatute.text}"`,
      "",
      `*Statutory Context:* ${retrievedStatute.title}. For clause-specific analysis or contract review, your supervising attorney will provide verified redlines in the contract report.`,
    ].join("\n");

    return res.status(200).json({
      reply: `${responseText}\n\n${INFORMATION_NOTICE}`,
      disclaimer: INFORMATION_NOTICE,
      source: {
        citation: retrievedStatute.citation,
        title: retrievedStatute.title,
      },
      isDisclaimer: false,
    });
  }

  return res.status(200).json({ reply: "I could not find an applicable source in the active statutory corpus for that question. Please clarify whether you need information about the rule, eligibility, exceptions, rate, duration, or procedure, or consult your reviewing attorney.",
    source: null, isDisclaimer: false, scope: "insufficient_evidence" });
});

module.exports = {
  handleChatbotMessage,
};
