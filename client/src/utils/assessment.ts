import type { ContractClause } from "../types/clause.js";

export function hasRecordedAssessment(clause: ContractClause): boolean {
  return clause.assessmentState === "assessed";
}

export function hasRiskDecision(clause: ContractClause): boolean {
  return hasRecordedAssessment(clause) || clause.attorneyStatus === "overridden";
}

export function evidenceNotice(clause: ContractClause): string | null {
  if (hasRecordedAssessment(clause)) return null;
  const reviewed = clause.attorneyStatus === "overridden" || clause.attorneyStatus === "dismissed";
  if (!clause.assessmentState || clause.assessmentState === "legacy_unverified") {
    return "Automated corpus coverage was not recorded for this older assessment. This is not evidence of legal compliance. Refer to the attorney's documented findings.";
  }
  const reasons: Record<string, string> = {
    no_matching_sources: "No applicable active source was retrieved.",
    irrelevant_sources: "Retrieved sources did not establish coverage for this clause.",
    retrieval_failed: "The statutory corpus could not be searched successfully.",
    unsupported_rule: "No implemented assessment rule was supported by the available sources.",
  };
  return `${reviewed ? "Automated assessment: insufficient corpus evidence. Attorney decision recorded separately." : "Insufficient corpus evidence \u2014 attorney review required."} ${reasons[clause.evidenceReason || ""] || "Corpus coverage could not be verified."}`;
}

export function formatContractType(value?: string): string {
  const names: Record<string, string> = { regular: "Regular", probationary: "Probationary", project_based: "Project-Based", fixed_term: "Fixed-Term", employment: "Employment (legacy selection)" };
  return names[value || ""] || "Not recorded";
}

export function screeningContext(clause: ContractClause): string | null {
  if (!clause.clientSelectedContractType) return null;
  const labels: Record<string, string> = {
    wage_deductions: "Wage deductions", non_compete_scope: "Non-compete scope", termination_due_process: "Termination and due process",
    injury_liability: "Injury liability", family_status: "Family-status restrictions", overtime_compensation: "Overtime compensation",
    intellectual_property: "Intellectual property", dispute_forum: "Dispute forum", restrictive_covenant: "Restrictive covenant", general_screening: "General employment screening",
  };
  return `Client-selected contract type: ${formatContractType(clause.clientSelectedContractType)}. ${clause.screeningScope === "type_specific_unassessed" ? "Type-specific assessment is not supported by an implemented rule; attorney review is required." : "General employment screening only; the selected type does not establish legal status or type-specific compliance."}${clause.screeningRule ? ` Screening check: ${labels[clause.screeningRule] || "General employment screening"}.` : ""}`;
}
