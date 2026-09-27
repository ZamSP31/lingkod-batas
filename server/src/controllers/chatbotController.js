const asyncHandler = require("express-async-handler");
const StatutorySource = require("../models/StatutorySource");

/**
 * Rule 6 (FAQ Guardrails): Intent classifier patterns for intercepting case-specific legal advice.
 */
const LEGAL_ADVICE_TRIGGERS = [
  /\b(should\s+i\s+sign|can\s+i\s+sue|can\s+my\s+employer\s+sue\s+me)\b/i,
  /\b(is\s+my\s+(?:boss|employer|company)\s+allowed\s+to\s+fire\s+me)\b/i,
  /\b(what\s+should\s+i\s+do\s+(?:if|about|with\s+my))\b/i,
  /\b(am\s+i\s+entitled\s+to\s+sue|give\s+me\s+legal\s+advice)\b/i,
  /\b(can\s+you\s+review\s+this\s+specific\s+clause|represent\s+me)\b/i,
  /\b(draft\s+me\s+a\s+contract|write\s+a\s+clause\s+for\s+me)\b/i,
  /\b(help\s+me\s+file\s+a\s+case|nlrc\s+complaint\s+filing)\b/i,
];

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
 * Fallback statutory knowledge base for core labor law concepts when database entries are pending.
 */
const FALLBACK_STATUTES = [
  {
    topic: "probation",
    keywords: ["probation", "probationary", "regularization", "regular"],
    citation: "Labor Code of the Philippines, Article 296 [formerly Art. 281]",
    title: "Probationary Employment",
    text: "Probationary employment shall not exceed six (6) months from the date the employee started working, unless it is covered by an apprenticeship agreement stipulating a longer period. An employee who is allowed to work after a probationary period shall be considered a regular employee.",
  },
  {
    topic: "termination_just_causes",
    keywords: [
      "termination",
      "terminate",
      "dismiss",
      "fire",
      "just cause",
      "misconduct",
    ],
    citation: "Labor Code of the Philippines, Article 297 [formerly Art. 282]",
    title: "Termination by Employer (Just Causes)",
    text: "An employer may terminate an employment for any of the following causes: (a) Serious misconduct or willful disobedience; (b) Gross and habitual neglect of duties; (c) Fraud or willful breach of trust; (d) Commission of a crime against the employer or family; and (e) Other causes analogous to the foregoing.",
  },
  {
    topic: "termination_authorized_causes",
    keywords: [
      "authorized cause",
      "redundancy",
      "retrenchment",
      "closure",
      "disease",
    ],
    citation: "Labor Code of the Philippines, Article 298 [formerly Art. 283]",
    title:
      "Closure of Establishment and Reduction of Personnel (Authorized Causes)",
    text: "The employer may also terminate the employment of any employee due to the installation of labor-saving devices, redundancy, retrenchment to prevent losses or the closing or cessation of operation of the establishment, provided separation pay is granted in accordance with statutory minimums.",
  },
  {
    topic: "wage_deductions",
    keywords: [
      "deduction",
      "deduct",
      "cash bond",
      "deposit",
      "withhold",
      "salary",
    ],
    citation: "Labor Code of the Philippines, Article 113",
    title: "Wage Deductions",
    text: "No employer, in his own behalf or in behalf of any person, shall make any deduction from the wages of his employees, except: (a) In cases where the worker is insured with his consent; (b) For union dues where authorized in writing; and (c) In cases where the employer is authorized by law or regulations issued by the Secretary of Labor.",
  },
  {
    topic: "hours_and_overtime",
    keywords: [
      "overtime",
      "hours of work",
      "8 hours",
      "rest day",
      "meal break",
    ],
    citation: "Labor Code of the Philippines, Articles 83-87",
    title: "Normal Hours of Work and Overtime Pay",
    text: "The normal hours of work of any employee shall not exceed eight (8) hours a day. Work may be performed beyond eight hours a day provided that the employee is paid for the overtime work, an additional compensation equivalent to his regular wage plus at least twenty-five percent (25%) thereof.",
  },
  {
    topic: "non_compete",
    keywords: [
      "non-compete",
      "non compete",
      "restrictive covenant",
      "restraint",
    ],
    citation:
      "Civil Code of the Philippines, Article 1306 & Jurisprudence (Century Properties v. Babiano)",
    title: "Autonomous Stipulations and Public Policy",
    text: "Post-employment restrictive covenants are evaluated under Civil Code Art. 1306. A non-compete clause is valid only if reasonable as to duration (customarily not exceeding 1-2 years), geographic scope, and protected trade secrets. Excessive or perpetual restraints are void as contrary to public policy.",
  },
  {
    topic: "13th_month",
    keywords: ["13th month", "bonus", "thirteenth month"],
    citation: "Presidential Decree No. 851",
    title: "13th Month Pay Law",
    text: "All employers are required to pay all their rank-and-file employees a 13th month pay not later than December 24 of every year, regardless of the nature of their employment, provided they have worked for at least one (1) month during the calendar year.",
  },
];

/**
 * POST /api/chatbot/message
 * Grounded RAG FAQ assistant answering Philippine Labor Law queries with Rule 6 Intent Guardrails.
 */
const handleChatbotMessage = asyncHandler(async (req, res) => {
  const message = (req.body.message || "").trim();

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

  const lowerMessage = message.toLowerCase();

  // 2. Platform Navigation & Exploration Guides
  const matchedGuide = PLATFORM_GUIDES.find((guide) =>
    guide.keywords.some((kw) => lowerMessage.includes(kw)),
  );

  if (matchedGuide) {
    return res.status(200).json({
      reply: `${matchedGuide.title.toUpperCase()}\n\n${matchedGuide.text}`,
      source: {
        citation: "Lingkod Batas Platform Navigation & Workflow",
        title: matchedGuide.title,
      },
      isDisclaimer: false,
    });
  }

  // 3. RAG Retrieval: Search database StatutorySource first for labor law queries
  let retrievedStatute = null;

  try {
    const searchTerms = message
      .replace(/[^\w\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5)
      .join(" ");

    if (searchTerms) {
      const dbMatches = await StatutorySource.find(
        {
          isActive: true,
          $text: { $search: searchTerms },
        },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(1);

      if (dbMatches && dbMatches.length > 0) {
        retrievedStatute = {
          citation: dbMatches[0].citation,
          title: dbMatches[0].title,
          text: dbMatches[0].provisionText,
        };
      }
    }
  } catch {
    // If text index unavailable, continue to fallback corpus
  }

  // 4. Fallback matching if database text search had no hits
  if (!retrievedStatute) {
    const matched = FALLBACK_STATUTES.find((item) =>
      item.keywords.some((kw) => lowerMessage.includes(kw)),
    );
    if (matched) {
      retrievedStatute = matched;
    }
  }

  // 5. Synthesize educational statutory response
  if (retrievedStatute) {
    const responseText = [
      `Under Philippine Labor Law (${retrievedStatute.citation}):`,
      "",
      `"${retrievedStatute.text}"`,
      "",
      `*Statutory Context:* ${retrievedStatute.title}. For clause-specific analysis or contract review, your supervising attorney will provide verified redlines in the contract report.`,
    ].join("\n");

    return res.status(200).json({
      reply: responseText,
      source: {
        citation: retrievedStatute.citation,
        title: retrievedStatute.title,
      },
      isDisclaimer: false,
    });
  }

  // 6. Helpful default response guiding exploration of both platform features and labor law
  const generalReply =
    "Hello. I am the Lingkod Batas Assistant. I can help you navigate the platform and provide factual information on Philippine Labor Law:\n\n" +
    "PLATFORM WORKFLOWS:\n" +
    "- 'How to upload' — Contract submission steps and formats\n" +
    "- 'How to track' — 5-stage review pipeline status\n" +
    "- 'View report' — How to read compliance findings and download PDF\n" +
    "- 'Data privacy' — PII sanitization under RA 10173\n" +
    "- 'Supported contracts' — Canonical employment classifications\n\n" +
    "LABOR CODE STATUTORY TOPICS:\n" +
    "- Probationary employment limits (Art. 296)\n" +
    "- Wage deduction rules (Art. 113)\n" +
    "- Hours of work & overtime (Art. 83-87)\n" +
    "- Just and authorized termination causes (Art. 297-298)\n" +
    "- 13th month pay requirements (PD 851)";

  return res.status(200).json({
    reply: generalReply,
    source: null,
    isDisclaimer: false,
  });
});

module.exports = {
  handleChatbotMessage,
};
