import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { updateFlag } from "../../services/attorneyService.js";
import type { ClauseRiskLevel, ContractClause } from "../../types/clause.js";

interface ClauseDetailPanelProps {
  clause: ContractClause;
  onClauseUpdated?: (updatedClause: ContractClause) => void;
}

/**
 * Clause Detail Panel for the Review Queue.
 * Matches modern UI/UX SaaS standards with a floating popover for risk overrides,
 * attorney personal advice block, and one-click undo.
 */
function ClauseDetailPanel({
  clause,
  onClauseUpdated,
}: ClauseDetailPanelProps) {
  const { token } = useAuth();
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [attorneyNote, setAttorneyNote] = useState(clause.attorneyNote || "");
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);

  const overrideMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss override menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        overrideMenuRef.current &&
        !overrideMenuRef.current.contains(event.target as Node)
      ) {
        setShowOverrideMenu(false);
      }
    }

    if (showOverrideMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOverrideMenu]);

  // Reset local panel state whenever a new clause is selected
  useEffect(() => {
    setAttorneyNote(clause.attorneyNote || "");
    setActionStatus(null);
    setIsEditingNote(false);
    setShowOverrideMenu(false);
  }, [clause.id, clause.attorneyNote]);

  const isFlagged =
    clause.riskLevel === "high" || clause.riskLevel === "medium";
  const isModified =
    clause.attorneyStatus === "approved" ||
    clause.attorneyStatus === "overridden" ||
    Boolean(clause.attorneyNote);

  async function handleApprove() {
    if (!token) return;
    try {
      setIsUpdating(true);
      await updateFlag(clause.id, { attorneyStatus: "approved" }, token);
      setActionStatus("Approved by counsel");
      setShowOverrideMenu(false);
      onClauseUpdated?.({
        ...clause,
        attorneyStatus: "approved",
      });
    } catch {
      setActionStatus("Failed to approve");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleOverrideTo(level: ClauseRiskLevel) {
    if (!token) return;
    try {
      setIsUpdating(true);
      await updateFlag(
        clause.id,
        {
          attorneyStatus: "overridden",
          attorneyRiskOverride: level,
        },
        token,
      );
      const label =
        level === "low"
          ? "Clear (Low)"
          : level === "medium"
            ? "Medium-risk"
            : "High-risk";
      setActionStatus(`Overridden: Marked as ${label}`);
      setShowOverrideMenu(false);
      onClauseUpdated?.({
        ...clause,
        riskLevel: level,
        attorneyStatus: "overridden",
      });
    } catch {
      setActionStatus("Failed to override");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleResetToAi() {
    if (!token) return;
    try {
      setIsUpdating(true);
      const originalRisk = clause.originalAiRiskLevel || "low";
      await updateFlag(
        clause.id,
        {
          attorneyStatus: "pending",
          attorneyRiskOverride: null,
        },
        token,
      );
      setActionStatus("Reset to original AI assessment");
      setShowOverrideMenu(false);
      onClauseUpdated?.({
        ...clause,
        riskLevel: originalRisk,
        attorneyStatus: "pending",
      });
    } catch {
      setActionStatus("Failed to reset");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSaveNote() {
    if (!token) return;
    try {
      setIsUpdating(true);
      await updateFlag(
        clause.id,
        {
          attorneyNote: attorneyNote.trim(),
        },
        token,
      );
      setActionStatus(
        attorneyNote.trim() ? "Personal note saved" : "Personal note cleared",
      );
      setIsEditingNote(false);
      onClauseUpdated?.({
        ...clause,
        attorneyNote: attorneyNote.trim(),
      });
    } catch {
      setActionStatus("Failed to save note");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="rounded-[8px] border border-line bg-white p-8 shadow-2xs">
      {/* Badges & Status Banner */}
      <div className="mb-5.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`rounded-full px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] uppercase ${
              clause.riskLevel === "high"
                ? "bg-maroon/9 text-maroon"
                : clause.riskLevel === "medium"
                  ? "bg-gold/15 text-gold"
                  : "bg-green/15 text-green"
            }`}
          >
            {clause.riskLevel === "high"
              ? "High-risk"
              : clause.riskLevel === "medium"
                ? "Medium-risk"
                : "Clear"}
          </span>
          <span className="rounded-full bg-parchment px-3 py-1 font-mono text-[10.5px] font-medium tracking-[0.04em] uppercase text-ink-soft">
            {clause.title} · Clause {clause.clauseNumber}
          </span>
        </div>

        {clause.attorneyStatus && clause.attorneyStatus !== "pending" && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold ${
              clause.attorneyStatus === "approved"
                ? "border-green/30 bg-green/10 text-green"
                : "border-navy/25 bg-navy/8 text-navy"
            }`}
          >
            {clause.attorneyStatus === "approved" ? (
              <svg
                className="h-3 w-3 stroke-current"
                viewBox="0 0 12 12"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="2.5 6 4.5 8 9.5 3" />
              </svg>
            ) : (
              <span className="text-xs">⚡</span>
            )}
            {clause.attorneyStatus === "approved"
              ? "Confirmed by Counsel"
              : "Overridden by Counsel"}
          </span>
        )}
      </div>

      {/* Quoted Clause Box */}
      <div className="mb-6.5 rounded-r-[6px] border-l-[3px] border-maroon bg-parchment p-5">
        <p className="font-serif text-[16.5px] italic leading-[1.7] text-navy-deep whitespace-pre-wrap">
          "{clause.quotedText}"
        </p>
      </div>

      {/* Analysis: Why Flagged */}
      {isFlagged && clause.flagReason && (
        <div className="mb-5.5">
          <span className="mb-2 block font-mono text-[11px] font-semibold tracking-[0.06em] text-maroon uppercase">
            Why this was flagged
          </span>
          <p className="text-[14.5px] leading-[1.7] text-[#3a352d]">
            {clause.flagReason}
          </p>
        </div>
      )}

      {/* Analysis: Legal Basis */}
      {isFlagged && clause.legalBasis && (
        <div className="mb-5.5">
          <span className="mb-2 block font-mono text-[11px] font-semibold tracking-[0.06em] text-navy uppercase">
            Legal basis
          </span>
          <div className="flex flex-col gap-1 rounded-[6px] bg-navy/4 p-4.5">
            <span className="font-mono text-[12.5px] font-semibold text-navy">
              {clause.legalBasis.citation}
            </span>
            <p className="text-[14.5px] leading-[1.7] text-[#3a352d] m-0">
              {clause.legalBasis.explanation}
            </p>
          </div>
        </div>
      )}

      {!isFlagged && (
        <div className="mb-5.5 text-[14px] text-ink-soft">
          No legal conflicts or high-risk issues were flagged by the AI for this
          clause.
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Prominent Attorney Advice & Personal Note Section */}
      {/* ------------------------------------------------------------- */}
      <div className="my-6 rounded-[8px] border border-gold/35 bg-gold/[0.04] p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-gold"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="font-mono text-[11.5px] font-bold tracking-[0.05em] text-navy uppercase">
              Attorney Personal Note &amp; Advice
            </span>
          </div>

          {!isEditingNote && (
            <button
              type="button"
              onClick={() => {
                setAttorneyNote(clause.attorneyNote || "");
                setIsEditingNote(true);
              }}
              className="rounded-[4px] bg-gold/15 px-3 py-1 text-xs font-semibold text-navy hover:bg-gold/25 cursor-pointer transition-colors"
            >
              {clause.attorneyNote ? "✏️ Edit note" : "＋ Add note"}
            </button>
          )}
        </div>

        {/* Note Display (when not editing) */}
        {!isEditingNote && (
          <div>
            {clause.attorneyNote ? (
              <p className="text-[13.5px] leading-[1.6] text-ink font-sans bg-white/70 rounded-[6px] border border-gold/20 p-3.5 m-0">
                {clause.attorneyNote}
              </p>
            ) : (
              <p className="text-xs text-ink-soft italic m-0">
                No personal note added yet. Click &quot;＋ Add note&quot; to
                include specific legal advice or renegotiation guidance for the
                client in their final report.
              </p>
            )}
          </div>
        )}

        {/* Note Form (when editing) */}
        {isEditingNote && (
          <div className="mt-3">
            <textarea
              value={attorneyNote}
              onChange={(e) => setAttorneyNote(e.target.value)}
              placeholder="e.g. Advise client to renegotiate this non-compete duration from 5 years to 1 year, and restrict territory exclusively to Metro Manila..."
              rows={3}
              className="w-full rounded-[6px] border border-line bg-white p-3 text-[13px] text-ink focus:border-navy focus:outline-none"
            />
            <div className="mt-2.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNote(false)}
                className="rounded px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={isUpdating}
                className="rounded bg-navy px-4 py-1.5 text-xs font-semibold text-parchment hover:bg-navy-deep cursor-pointer"
              >
                Save personal note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar with Floating Popover */}
      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-dashed border-line pt-5.5">
        <button
          type="button"
          onClick={handleApprove}
          disabled={isUpdating}
          className="rounded-[5px] bg-maroon px-5 py-2.5 text-[13.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright disabled:opacity-60 cursor-pointer"
        >
          Approve clause
        </button>

        {/* Floating Popover Container */}
        <div className="relative" ref={overrideMenuRef}>
          <button
            type="button"
            onClick={() => setShowOverrideMenu(!showOverrideMenu)}
            disabled={isUpdating}
            className={`flex items-center gap-1.5 rounded-[5px] border px-4 py-2.5 text-[13.5px] font-semibold transition-all cursor-pointer ${
              showOverrideMenu
                ? "border-navy bg-navy/5 text-navy shadow-xs"
                : "border-line bg-white text-ink hover:border-ink hover:bg-parchment/40"
            }`}
          >
            <span>Override flag</span>
            <svg
              className={`h-3.5 w-3.5 text-ink-soft transition-transform ${
                showOverrideMenu ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Floating Dropdown / Popover Menu */}
          {showOverrideMenu && (
            <div className="absolute left-0 bottom-full mb-2 w-72 rounded-[8px] border border-line bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-30 transition-all animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-line mb-1">
                <span className="font-mono text-[10.5px] font-semibold tracking-wider text-ink-soft uppercase">
                  Select Classification Override
                </span>
              </div>

              {/* Option 1: Clear / Low Risk */}
              <button
                type="button"
                onClick={() => handleOverrideTo("low")}
                disabled={isUpdating}
                className="flex w-full items-start gap-2.5 rounded-[6px] p-2.5 text-left transition-colors hover:bg-green/10 cursor-pointer"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-green shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-green">
                    Mark as Clear (Low Risk)
                  </div>
                  <div className="text-[11.5px] text-ink-soft leading-tight">
                    Standard compliant clause, no statutory violation.
                  </div>
                </div>
              </button>

              {/* Option 2: Medium Risk */}
              <button
                type="button"
                onClick={() => handleOverrideTo("medium")}
                disabled={isUpdating}
                className="flex w-full items-start gap-2.5 rounded-[6px] p-2.5 text-left transition-colors hover:bg-gold/10 cursor-pointer"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gold shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-gold">
                    Mark as Medium-Risk
                  </div>
                  <div className="text-[11.5px] text-ink-soft leading-tight">
                    Advisory concern; worth highlighting for client.
                  </div>
                </div>
              </button>

              {/* Option 3: High Risk */}
              <button
                type="button"
                onClick={() => handleOverrideTo("high")}
                disabled={isUpdating}
                className="flex w-full items-start gap-2.5 rounded-[6px] p-2.5 text-left transition-colors hover:bg-maroon/10 cursor-pointer"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-maroon shrink-0" />
                <div>
                  <div className="text-[13px] font-semibold text-maroon">
                    Mark as High-Risk
                  </div>
                  <div className="text-[11.5px] text-ink-soft leading-tight">
                    Direct violation of Labor Code or public policy.
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Instant Undo / Reset Option */}
        {isModified && (
          <button
            type="button"
            onClick={handleResetToAi}
            disabled={isUpdating}
            className="flex items-center gap-1.5 rounded-[5px] border border-dashed border-ink-soft/40 bg-transparent px-3.5 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:text-maroon hover:border-maroon disabled:opacity-60 cursor-pointer"
          >
            <span>↺</span>
            <span>Reset to AI</span>
          </button>
        )}
      </div>

      {actionStatus && (
        <div className="mt-3 font-mono text-xs text-maroon animate-fade-in">
          ✓ {actionStatus}
        </div>
      )}
    </div>
  );
}

export default ClauseDetailPanel;
