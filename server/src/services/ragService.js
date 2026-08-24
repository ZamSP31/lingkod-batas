/**
 * ragService.js
 * RAG-Powered AI Risk Analysis Pipeline for Philippine Employment Contracts.
 *
 * Combines statutory corpus retrieval (Labor Code, DOLE Orders, Jurisprudence)
 * with legal risk reasoning to generate structured ContractFlag records.
 */

const StatutorySource = require("../models/StatutorySource");
const Contract = require("../models/Contract");
const ContractFlag = require("../models/ContractFlag");
const { segmentContractText } = require("./clauseSegmenter");

/**
 * Retrieves statutory context from MongoDB based on clause category and text terms.
 * @param {Object} clause
 * @returns {Promise<Array<{ sourceId: string, citation: string, title: string, excerpt: string }>>}
 */
async function retrieveStatutoryContext(clause) {
  try {
    const searchCategories = clause.allCategories || [
      clause.category || "other",
    ];

    // 1. Find statutes matching category tags
    const categoryMatches = await StatutorySource.find({
      isActive: true,
      tags: { $in: searchCategories },
    }).limit(3);

    // 2. Perform text search for specific keywords in the clause
    const textQuery = clause.clauseText
      .replace(/[^\w\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 6)
      .join(" ");

    let textMatches = [];
    if (textQuery) {
      try {
        textMatches = await StatutorySource.find(
          {
            isActive: true,
            $text: { $search: textQuery },
          },
          { score: { $meta: "textScore" } },
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(2);
      } catch {
        // If text index not available, continue with category matches
      }
    }

    // Merge and deduplicate
    const combined = [...categoryMatches];
    for (const tm of textMatches) {
      if (!combined.some((c) => c._id.toString() === tm._id.toString())) {
        combined.push(tm);
      }
    }

    return combined.slice(0, 3).map((statute) => ({
      sourceId: statute._id,
      citation: statute.citation,
      title: statute.title,
      excerpt:
        statute.provisionText.length > 250
          ? `${statute.provisionText.substring(0, 250)}...`
          : statute.provisionText,
    }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[ragService] Statutory retrieval error:", error.message);
    return [];
  }
}

/**
 * Legal rule-based risk evaluation for Philippine labor compliance.
 * @param {Object} clause
 * @param {Array} statutes
 * @returns {{
 *   aiRiskLevel: 'low' | 'medium' | 'high',
 *   aiRationale: string,
 *   statutoryBases: Array<{ sourceId: any, citation: string, excerpt: string }>,
 *   riskCategories: string[]
 * }}
 */
function evaluateClauseRisk(clause, statutes) {
  const text = clause.clauseText.toLowerCase();
  const categories = clause.allCategories || [clause.category || "other"];

  // --- 1. PROHIBITED WAGE DEDUCTIONS & CASH BONDS (HIGH RISK) ---
  if (
    (text.includes("deduct") ||
      text.includes("deduction") ||
      text.includes("withhold")) &&
    (text.includes("loss") ||
      text.includes("damage") ||
      text.includes("penalty") ||
      text.includes("training bond") ||
      text.includes("fine") ||
      text.includes("deposit") ||
      text.includes("cash bond") ||
      text.includes("without prior written authorization"))
  ) {
    const matchedStatute = statutes.find(
      (s) => s.citation.includes("113") || s.citation.includes("114"),
    ) || {
      citation: "Labor Code of the Philippines, Art. 113 & Art. 114",
      excerpt:
        "No employer shall make unauthorized deductions from wages or require deposits/cash bonds for loss or damage without DOLE authorization.",
    };

    return {
      aiRiskLevel: "high",
      aiRationale:
        "This clause permits the employer to make wage deductions or require cash deposits for damage/penalties without meeting the strict statutory exceptions under Article 113 or obtaining explicit Secretary of Labor authorization under Article 114.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["wage_and_hours"],
    };
  }

  // --- 2. UNREASONABLE / EXCESSIVE NON-COMPETE (HIGH RISK) ---
  if (
    (text.includes("non-compete") ||
      text.includes("non compete") ||
      text.includes("covenant not to compete") ||
      text.includes("competing business")) &&
    (text.includes("5 year") ||
      text.includes("five year") ||
      text.includes("3 year") ||
      text.includes("three year") ||
      text.includes("global") ||
      text.includes("worldwide") ||
      text.includes("anywhere in the world") ||
      text.includes("any other company") ||
      text.includes("indefinitely") ||
      text.includes("perpetual") ||
      (!text.includes("geographic") &&
        !text.includes("radius") &&
        !text.includes("compensation") &&
        (text.includes("2 year") || text.includes("two year"))))
  ) {
    const matchedStatute = statutes.find(
      (s) => s.citation.includes("Babiano") || s.citation.includes("Solidbank"),
    ) || {
      citation:
        "Supreme Court: Century Properties, Inc. v. Babiano (G.R. No. 197822)",
      excerpt:
        "A post-employment non-compete is void if it imposes an unreasonable duration (>1-2 years), lacks geographic limitation, or unduly restrains the worker’s constitutional right to earn a livelihood.",
    };

    return {
      aiRiskLevel: "high",
      aiRationale:
        "The non-compete restraint is excessively broad in duration or territorial scope without reasonable consideration. Under Philippine jurisprudence (Century Properties v. Babiano), restrictive covenants that lack strict geographic limits or exceed customary duration are void as against public policy.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["non_compete"],
    };
  }

  // --- 3. AT-WILL TERMINATION / WAIVER OF DUE PROCESS (HIGH RISK) ---
  if (
    (text.includes("terminate") ||
      text.includes("dismiss") ||
      text.includes("separation")) &&
    (text.includes("at will") ||
      text.includes("without cause") ||
      text.includes("sole discretion without notice") ||
      text.includes("waives any right to notice") ||
      text.includes("without hearing") ||
      text.includes("immediate termination without explanation"))
  ) {
    const matchedStatute = statutes.find(
      (s) =>
        s.citation.includes("279") ||
        s.citation.includes("297") ||
        s.citation.includes("147-15"),
    ) || {
      citation: "Labor Code of the Philippines, Art. 279 & DOLE D.O. 147-15",
      excerpt:
        "Security of tenure guarantees employees cannot be dismissed without just/authorized cause and full adherence to the two-notice procedural due process rule.",
    };

    return {
      aiRiskLevel: "high",
      aiRationale:
        'This provision attempts to institute "at-will" termination or bypass the statutory two-notice procedural due process rule. In the Philippines, security of tenure is constitutionally protected under Article 279 of the Labor Code.',
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["termination"],
    };
  }

  // --- 4. WAIVER OF EMPLOYER LIABILITY FOR INJURY/DEATH (HIGH RISK) ---
  if (
    (text.includes("waive") ||
      text.includes("hold harmless") ||
      text.includes("release from liability")) &&
    (text.includes("injury") ||
      text.includes("accident") ||
      text.includes("death") ||
      text.includes("work-related") ||
      text.includes("illness") ||
      text.includes("medical"))
  ) {
    const matchedStatute = statutes.find((s) =>
      s.citation.includes("1711"),
    ) || {
      citation: "Civil Code of the Philippines, Art. 1711 & Art. 1712",
      excerpt:
        "Employers are strictly liable for work-related death or injuries; advance contractual waivers of such liability are null and void.",
    };

    return {
      aiRiskLevel: "high",
      aiRationale:
        "The clause attempts to exempt the employer from liability for work-connected illnesses, accidents, or death. Under Articles 1711 and 1712 of the Civil Code and Philippine labor standards, employer liability for occupational harm cannot be waived in advance.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["liability_waiver"],
    };
  }

  // --- 5. DISCRIMINATORY / MARRIAGE RESTRICTIONS (HIGH RISK) ---
  if (
    text.includes("marriage") ||
    text.includes("get married") ||
    text.includes("become pregnant") ||
    text.includes("pregnancy")
  ) {
    const matchedStatute = statutes.find((s) => s.citation.includes("136")) || {
      citation: "Labor Code of the Philippines, Art. 136",
      excerpt:
        "It shall be unlawful for an employer to require as a condition of employment that a woman shall not get married or become pregnant.",
    };

    return {
      aiRiskLevel: "high",
      aiRationale:
        "Stipulations against marriage or conditions restricting family status are strictly unlawful under Article 136 of the Labor Code of the Philippines.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["other", "termination"],
    };
  }

  // --- 6. OVERTIME / HOURS OF WORK DEFICIENCY (MEDIUM RISK) ---
  if (
    (text.includes("overtime") ||
      text.includes("extra hours") ||
      text.includes("hours of work") ||
      text.includes("weekend work")) &&
    (text.includes("no overtime pay") ||
      text.includes("without additional compensation") ||
      text.includes("deemed included in base salary") ||
      text.includes("mandatory uncompensated") ||
      text.includes("over 48 hours"))
  ) {
    const matchedStatute = statutes.find((s) => s.citation.includes("87")) || {
      citation: "Labor Code of the Philippines, Art. 87",
      excerpt:
        "Work performed beyond eight hours daily must be compensated with additional premium of at least 25% to 30%.",
    };

    return {
      aiRiskLevel: "medium",
      aiRationale:
        "The clause suggests overtime or extended work will not be compensated with statutory overtime premiums, which violates Article 87 unless the employee is a managerial or exempt professional employee.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["wage_and_hours"],
    };
  }

  // --- 7. OVERLY BROAD IP ASSIGNMENT (MEDIUM RISK) ---
  if (
    (text.includes("intellectual property") ||
      text.includes("inventions") ||
      text.includes("copyright") ||
      text.includes("patents")) &&
    (text.includes("all inventions developed prior") ||
      text.includes(
        "created outside working hours without company equipment",
      ) ||
      text.includes("personal projects") ||
      text.includes("unrelated to company business"))
  ) {
    const matchedStatute = statutes.find((s) =>
      s.citation.includes("8293"),
    ) || {
      citation: "Republic Act No. 8293 (Intellectual Property Code), Sec. 30",
      excerpt:
        "Inventions created by an employee outside regularly assigned duties and without company resources belong to the employee.",
    };

    return {
      aiRiskLevel: "medium",
      aiRationale:
        "The intellectual property assignment captures personal inventions or prior works created without employer resources, contrary to Section 30 of R.A. 8293.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["intellectual_property"],
    };
  }

  // --- 8. JURISDICTION / FOREIGN FORUM (MEDIUM RISK) ---
  if (
    (text.includes("jurisdiction") ||
      text.includes("venue") ||
      text.includes("governing law")) &&
    (text.includes("exclusive jurisdiction of foreign") ||
      text.includes("courts of singapore") ||
      text.includes("courts of delaware") ||
      text.includes("waiver of nlrc"))
  ) {
    const matchedStatute = statutes.find((s) => s.citation.includes("224")) || {
      citation: "Labor Code of the Philippines, Art. 224",
      excerpt:
        "Labor Arbiters have original and exclusive jurisdiction over labor disputes arising in the Philippines.",
    };

    return {
      aiRiskLevel: "medium",
      aiRationale:
        "Mandating exclusive foreign jurisdiction to resolve Philippine employment disputes may be unenforceable if it attempts to oust the National Labor Relations Commission (NLRC) of its statutory jurisdiction under Article 224.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: ["jurisdiction"],
    };
  }

  // --- 9. MODERATE RESTRICTIVE COVENANTS (MEDIUM RISK) ---
  if (
    text.includes("non-compete") ||
    text.includes("non compete") ||
    text.includes("non-solicitation") ||
    text.includes("non solicitation")
  ) {
    const matchedStatute = statutes[0] || {
      citation: "Century Properties, Inc. v. Babiano (G.R. No. 197822)",
      excerpt:
        "Non-compete provisions must be reviewed for reasonableness in trade, duration, and geography.",
    };

    return {
      aiRiskLevel: "medium",
      aiRationale:
        "This restrictive covenant should be reviewed by an attorney to verify that the time limitation, trade scope, and geographical boundaries are reasonable under Philippine standards.",
      statutoryBases: [
        {
          sourceId: matchedStatute.sourceId,
          citation: matchedStatute.citation,
          excerpt: matchedStatute.excerpt,
        },
      ],
      riskCategories: categories,
    };
  }

  // --- 10. STANDARD / COMPLIANT CLAUSE (LOW RISK) ---
  const defaultStatute = statutes[0] || {
    citation: "Labor Code of the Philippines",
    excerpt:
      "Standard contractual provision subject to general labor standards.",
  };

  return {
    aiRiskLevel: "low",
    aiRationale:
      "Standard contractual term. No direct violation of Philippine Labor Code provisions or public policy detected.",
    statutoryBases: defaultStatute.sourceId
      ? [
          {
            sourceId: defaultStatute.sourceId,
            citation: defaultStatute.citation,
            excerpt: defaultStatute.excerpt,
          },
        ]
      : [],
    riskCategories: categories,
  };
}

/**
 * Orchestrates full RAG analysis for a contract:
 * 1. Segments text into discrete clauses.
 * 2. Retrieves statutory context for each clause.
 * 3. Analyzes risk and creates ContractFlag records.
 * 4. Calculates overall contract risk and updates status to 'awaiting_attorney_review'.
 *
 * @param {string|mongoose.Types.ObjectId} contractId
 * @returns {Promise<{
 *   contractId: string,
 *   totalClauses: number,
 *   flagsCreated: number,
 *   aiRiskLevel: 'low' | 'medium' | 'high'
 * }>}
 */
async function analyzeContract(contractId) {
  try {
    const contract = await Contract.findById(contractId);
    if (!contract) {
      throw new Error(`Contract ${contractId} not found.`);
    }

    const rawText = contract.rawOcrText || "";
    if (!rawText.trim()) {
      // eslint-disable-next-line no-console
      console.warn(`[ragService] Contract ${contractId} has empty OCR text.`);
      await Contract.findByIdAndUpdate(contractId, {
        status: "awaiting_attorney_review",
        flaggedForManualReview: true,
        aiRiskLevel: "low",
      });
      return {
        contractId,
        totalClauses: 0,
        flagsCreated: 0,
        aiRiskLevel: "low",
      };
    }

    // 1. Segment contract into clauses
    const clauses = segmentContractText(rawText);

    // 2. Clear any prior pending flags for this contract
    await ContractFlag.deleteMany({
      contractId: contract._id,
      attorneyStatus: "pending",
    });

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    const flagDocs = [];

    // 3. Analyze each clause against statutory corpus
    for (const clause of clauses) {
      const statutes = await retrieveStatutoryContext(clause);
      const evaluation = evaluateClauseRisk(clause, statutes);

      if (evaluation.aiRiskLevel === "high") highRiskCount++;
      if (evaluation.aiRiskLevel === "medium") mediumRiskCount++;

      flagDocs.push({
        contractId: contract._id,
        clauseText: clause.clauseText,
        clauseIndex: clause.clauseIndex,
        aiRiskLevel: evaluation.aiRiskLevel,
        aiRationale: evaluation.aiRationale,
        statutoryBases: evaluation.statutoryBases,
        riskCategories: evaluation.riskCategories,
        attorneyStatus: "pending",
        includedInReport: true,
      });
    }

    // 4. Batch insert flags into MongoDB
    if (flagDocs.length > 0) {
      await ContractFlag.insertMany(flagDocs);
    }

    // 5. Calculate overall contract risk
    let overallRisk = "low";
    if (highRiskCount > 0) {
      overallRisk = "high";
    } else if (mediumRiskCount > 0) {
      overallRisk = "medium";
    }

    // 6. Transition contract lifecycle stage to 'awaiting_attorney_review'
    await Contract.findByIdAndUpdate(contractId, {
      aiRiskLevel: overallRisk,
      status: "awaiting_attorney_review",
    });

    // eslint-disable-next-line no-console
    console.log(
      `[ragService] Contract ${contractId} analyzed: ${clauses.length} clauses, ${flagDocs.length} flags generated, Overall Risk: ${overallRisk.toUpperCase()}`,
    );

    return {
      contractId: contract._id.toString(),
      totalClauses: clauses.length,
      flagsCreated: flagDocs.length,
      aiRiskLevel: overallRisk,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `[ragService] Error analyzing contract ${contractId}:`,
      error.message,
    );

    // Prevent contract from hanging
    await Contract.findByIdAndUpdate(contractId, {
      status: "awaiting_attorney_review",
      attorneyNotes: `AI Analysis note: ${error.message}`,
    }).catch(() => {});

    throw error;
  }
}

module.exports = {
  analyzeContract,
  retrieveStatutoryContext,
  evaluateClauseRisk,
};
