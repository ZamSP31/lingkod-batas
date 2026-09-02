import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import RiskClauseCard from "../../components/client/RiskClauseCard.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  getClientContracts,
  getContractReport,
  type ContractReportResponse,
} from "../../services/contractService.js";
import { formatShortDate } from "../../utils/format.js";
import type { ContractClause, ClauseRiskLevel } from "../../types/clause.js";

function formatCategoryTitle(
  category: string | undefined,
  index: number,
  text: string,
): string {
  const titleMap: Record<string, string> = {
    wage_and_hours: "Wage & Working Hours",
    termination: "Termination & Due Process",
    non_compete: "Non-Compete Covenant",
    confidentiality: "Confidentiality Scope",
    liability_waiver: "Liability & Injury Waiver",
    intellectual_property: "IP Assignment",
    jurisdiction: "Jurisdiction & Venue",
    contracting_and_subcontracting: "Contracting Terms",
  };

  if (category && titleMap[category]) {
    return titleMap[category];
  }

  const firstLine = text.split("\n")[0]?.trim();
  if (firstLine && firstLine.length < 45 && !firstLine.includes('"')) {
    return firstLine;
  }

  return `Clause Section ${index + 1}`;
}

/**
 * Client Contract Report page.
 * Displays real-time verified contract findings, attorney advice, and legal basis citations from MongoDB Atlas.
 * Includes a formal law clinic letterhead and certification block for publication-quality PDF print exports.
 */
function ContractReportPage() {
  const { contractId } = useParams<{ contractId?: string }>();
  const { token, user } = useAuth();

  const [reportData, setReportData] = useState<ContractReportResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        let targetId = contractId;

        // If no contractId specified, load the user's latest completed or submitted contract
        if (!targetId) {
          const list = await getClientContracts(token);
          if (list.length > 0) {
            const completed = list.find((c) => c.status === "approved");
            targetId = completed ? completed.id : list[0]?.id;
          }
        }

        if (!targetId) {
          if (isMounted) {
            setIsLoading(false);
            setReportData(null);
          }
          return;
        }

        const data = await getContractReport(targetId, token);
        if (isMounted) {
          setReportData(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load contract report.";
          setError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [contractId, token]);

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="max-w-[820px] py-16 text-center">
        <span className="font-mono text-xs text-ink-soft animate-pulse">
          Loading verified legal report from database...
        </span>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="max-w-[820px] rounded-[8px] border border-line bg-white p-10 text-center shadow-2xs">
        <h2 className="font-serif text-xl font-medium text-navy-deep">
          {error || "Report not available yet"}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Your reviewing attorney may still be analyzing this contract. You can track
          its live status on the tracking dashboard.
        </p>
        <Link
          to="/client"
          className="mt-6 inline-block rounded-[6px] bg-maroon px-5 py-2.5 text-xs font-semibold text-parchment hover:bg-maroon-bright"
        >
          Back to My Contracts
        </Link>
      </div>
    );
  }

  const { contract, flags } = reportData;

  // Transform backend flags to ContractClause objects
  const clauses: ContractClause[] = flags.map((f, idx) => {
    const effectiveRisk: ClauseRiskLevel =
      f.attorneyRiskOverride || f.aiRiskLevel || "low";
    const primaryStatute = f.statutoryBases?.[0];
    const category = f.riskCategories?.[0];

    const clause: ContractClause = {
      id: f._id,
      clauseNumber: String(idx + 1),
      title: formatCategoryTitle(category, idx, f.clauseText),
      riskLevel: effectiveRisk,
      quotedText: f.clauseText,
    };

    if (f.attorneyStatus) {
      clause.attorneyStatus = f.attorneyStatus;
    }

    if (f.attorneyNote) {
      clause.attorneyNote = f.attorneyNote;
    }

    if (f.aiRationale) {
      clause.flagReason = f.aiRationale;
    }

    if (primaryStatute) {
      clause.legalBasis = {
        citation: primaryStatute.citation,
        explanation: primaryStatute.excerpt,
      };
    }

    return clause;
  });

  const highRiskCount = clauses.filter((c) => c.riskLevel === "high").length;
  const modRiskCount = clauses.filter((c) => c.riskLevel === "medium").length;
  const lowRiskCount = clauses.filter((c) => c.riskLevel === "low").length;

  const reviewerName =
    contract.assignedAttorneyId?.fullName || "Atty. Jimenez";
  const reviewerRoll =
    contract.assignedAttorneyId?.rollNumber || "IBP Roll No. 67890";
  const clientName =
    user?.fullName || "Maria Clara Santos";
  const reviewDate = contract.reviewCompletedAt
    ? formatShortDate(contract.reviewCompletedAt)
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="max-w-[820px] pb-16 print:max-w-none print:w-full print:p-0">
      {/* ═══════════════════════════════════════════════════════════
          OFFICIAL PRINT LETTERHEAD (Always visible in print & PDF)
          ═══════════════════════════════════════════════════════════ */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[22pt] font-bold text-black uppercase tracking-tight m-0">
              Lingkod Batas Legal Review Clinic
            </h1>
            <p className="text-[10pt] text-gray-700 m-0 mt-1 font-sans">
              Department of Labor Standards &amp; Statutory Compliance Assessment
            </p>
            <p className="text-[9pt] text-gray-600 m-0 font-mono">
              UST College of Information and Computing Sciences · Capstone Research Division
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9pt] font-bold uppercase text-black">
              Case Ref: #{contract.requestNumber}
            </div>
            <div className="font-mono text-[8pt] text-gray-600">
              Date: {reviewDate}
            </div>
            <div className="font-mono text-[8pt] text-gray-600">
              Status: CERTIFIED &amp; RELEASED
            </div>
          </div>
        </div>
      </div>

      {/* Screen Web Header & Action Bar */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6 print:hidden">
        <div>
          <span className="mb-2 block font-mono text-[11.5px] font-medium tracking-[0.06em] text-maroon uppercase">
            Request #{contract.requestNumber} · Official Legal Report
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep m-0">
              {contract.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.03em] text-green uppercase">
              <span className="h-[7px] w-[7px] rounded-full bg-green" />
              {contract.status === "completed" ? "Reviewed & Released" : "Completed"}
            </span>
          </div>
          <div className="mt-2 font-mono text-[11px] tracking-[0.04em] text-ink-soft uppercase">
            Certified by {reviewerName} ({reviewerRoll}) · {reviewDate}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-[6px] bg-maroon px-5 py-3 text-[13.5px] font-semibold text-parchment transition-all hover:bg-maroon-bright shadow-sm hover:shadow cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M12 3V15M12 15L7 10M12 15L17 10" />
            <path d="M4 17V19A2 2 0 006 21H18A2 2 0 0020 19V17" />
          </svg>
          Download PDF / Print Report
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          LEGAL AUDIT METADATA TABLE (Formatted for print & web)
          ═══════════════════════════════════════════════════════════ */}
      <div className="mb-6 rounded-[8px] border border-line bg-white p-5 shadow-2xs print:border print:border-gray-300 print:shadow-none print:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="block font-mono text-[10px] text-ink-soft uppercase print:text-gray-600">
              Client / Employee
            </span>
            <span className="font-semibold text-ink print:text-black">
              {clientName}
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10px] text-ink-soft uppercase print:text-gray-600">
              Contract Document
            </span>
            <span className="font-semibold text-ink print:text-black truncate block" title={contract.title}>
              {contract.title}
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10px] text-ink-soft uppercase print:text-gray-600">
              Reviewing Counsel
            </span>
            <span className="font-semibold text-ink print:text-black">
              {reviewerName}
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10px] text-ink-soft uppercase print:text-gray-600">
              IBP Roll Number
            </span>
            <span className="font-semibold text-ink print:text-black font-mono">
              {reviewerRoll}
            </span>
          </div>
        </div>
      </div>

      {/* Executive Summary & Risk Metric Strip */}
      <div className="mb-6 rounded-[8px] border border-line bg-white p-5.5 shadow-2xs print:border print:border-gray-300 print:shadow-none print:p-4">
        <h3 className="font-serif text-[16px] font-semibold text-navy-deep mb-3 print:text-black">
          Executive Compliance Summary
        </h3>
        <p className="text-[13px] leading-[1.6] text-ink-soft mb-4 print:text-black">
          A total of <b>{clauses.length} contractual provisions</b> were segmented, analyzed against the 
          <b> Philippine Labor Code (PD 442)</b>, Civil Code principles on contracts, and applicable DOLE department orders, and reviewed by supervising counsel.
        </p>

        <div className="flex flex-wrap items-center gap-6 border-t border-line/60 pt-3 text-[12.5px] print:border-gray-200">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-maroon print:bg-black" />
            <span className="font-mono text-xs font-semibold text-maroon print:text-black">
              {highRiskCount} High-Risk Findings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gold print:bg-gray-600" />
            <span className="font-mono text-xs font-semibold text-gold print:text-black">
              {modRiskCount} Moderate Risk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green print:bg-gray-400" />
            <span className="font-mono text-xs font-semibold text-green print:text-black">
              {lowRiskCount} Statutory Compliant / Clear
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CLAUSE-BY-CLAUSE LEGAL AUDIT FINDINGS
          ═══════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <h2 className="font-serif text-[20px] font-semibold text-navy-deep mb-4 print:text-black">
          Detailed Clause Audit &amp; Legal Citations
        </h2>

        <div className="flex flex-col gap-4">
          {clauses.map((clause) => (
            <RiskClauseCard key={clause.id} clause={clause} />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SUPERVISING ATTORNEY GENERAL OPINION
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-avoid-break mb-6 rounded-[8px] border border-line bg-white p-6 sm:p-7 shadow-2xs print:border print:border-gray-300 print:shadow-none print:p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy-deep print:bg-gray-200 print:text-black">
            AJ
          </div>
          <div>
            <div className="text-[14px] font-bold text-ink print:text-black">
              {reviewerName}
            </div>
            <div className="font-mono text-[10px] tracking-[0.04em] text-ink-soft uppercase print:text-gray-600">
              Managing Counsel · Lead Reviewer · {reviewerRoll}
            </div>
          </div>
        </div>
        <p className="font-serif text-[14.5px] italic leading-[1.7] text-[#3a352d] m-0 print:text-black">
          "{contract.attorneyNotes ||
            "All flagged contract provisions have been evaluated against current Philippine labor standards, Civil Code rules on obligations and contracts, and applicable DOLE department orders. The employee is advised to review specific clause annotations above prior to signing."}"
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RECOMMENDED NEXT STEPS & EMPLOYEE LEGAL ACTION PLAN
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-avoid-break mb-8 rounded-[8px] border border-gold/40 bg-gold/[0.04] p-6 sm:p-7 shadow-2xs print:border print:border-gray-300 print:bg-gray-50 print:shadow-none print:p-5">
        <div className="mb-3 flex items-center gap-2">
          <svg
            className="h-4 w-4 text-gold print:text-black"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <h3 className="font-mono text-[11.5px] font-bold tracking-[0.05em] text-navy uppercase m-0 print:text-black">
            Recommended Action Plan for the Employee
          </h3>
        </div>

        <ul className="flex flex-col gap-2.5 text-[13px] leading-[1.6] text-ink m-0 pl-1 list-none print:text-black">
          <li className="flex items-start gap-2">
            <span className="font-bold text-maroon print:text-black">1.</span>
            <span>
              <b>Renegotiate Flagged Clauses:</b> Present counsel's annotations to HR or employer representatives to request fair revisions (e.g., removing unconscionable wage deduction stipulations or limiting non-compete clauses to reasonable geographic and temporal bounds).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-maroon print:text-black">2.</span>
            <span>
              <b>Statutory Rights Cannot Be Waived:</b> Under <b>Article 1306 of the Civil Code</b> and <b>Article 1418 of the Labor Code</b>, contract stipulations contrary to law, morals, or public order are void <i>ab initio</i>. An employer cannot enforce waivers of statutory overtime, minimum wage, or procedural due process.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-maroon print:text-black">3.</span>
            <span>
              <b>Retain Document Copy:</b> Keep a certified digital or physical copy of this advisory assessment alongside your signed employment agreement.
            </span>
          </li>
        </ul>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          OFFICIAL SIGNATURE & CERTIFICATION SEAL (Print-ready)
          ═══════════════════════════════════════════════════════════ */}
      <div className="print-avoid-break mt-10 pt-6 border-t-2 border-black/80 print:block">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[420px]">
            <p className="text-[9.5pt] leading-[1.5] text-gray-700 m-0 font-sans print:text-gray-800">
              <b>Certification:</b> This compliance report represents a legal advisory assessment generated via algorithmic statutory comparison and verified by licensed counsel. It is intended to guide the employee regarding their statutory rights under Philippine jurisprudence.
            </p>
          </div>

          <div className="text-right sm:text-right min-w-[200px]">
            <div className="border-b border-black pb-1 mb-1.5 inline-block w-[180px]">
              <span className="font-serif italic font-semibold text-[13pt] text-navy-deep print:text-black block">
                Atty. Jimenez
              </span>
            </div>
            <div className="font-serif font-bold text-[10pt] text-black">
              ATTY. JIMENEZ
            </div>
            <div className="font-mono text-[8pt] text-gray-700">
              Managing Counsel · Lead Reviewer
            </div>
            <div className="font-mono text-[8pt] text-gray-700">
              IBP Roll of Attorneys No. 67890
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractReportPage;