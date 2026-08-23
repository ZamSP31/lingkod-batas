import type { ClientContractSummary } from "../../types/contract.js";

interface CompletedReportsPanelProps {
  contracts: ClientContractSummary[];
  onDownload: (contractId: string) => void;
}

/**
 * Completed Reports card matching Screen 8 bento component.
 */
function CompletedReportsPanel({
  contracts,
  onDownload,
}: CompletedReportsPanelProps) {
  return (
    <div className="rounded-[8px] border border-line bg-white shadow-2xs">
      <div className="border-b border-line px-[22px] py-[18px]">
        <h3 className="font-serif text-[16.5px] font-medium text-navy-deep m-0">
          Completed reports
        </h3>
      </div>

      {contracts.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-soft">
          No finalized reports available yet.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {contracts.map((contract) => (
            <li
              key={contract.id}
              className="flex items-center justify-between gap-3 px-[22px] py-[15px]"
            >
              <span className="min-w-0 truncate text-[13px] font-semibold text-ink">
                {contract.title}
              </span>
              <button
                type="button"
                onClick={() => onDownload(contract.id)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-maroon hover:text-maroon-bright cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-3 w-3"
                >
                  <path d="M12 3V15M12 15L7 10M12 15L17 10" />
                  <path d="M4 17V19A2 2 0 006 21H18A2 2 0 0020 19V17" />
                </svg>
                PDF
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CompletedReportsPanel;