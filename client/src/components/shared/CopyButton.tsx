import { useState } from "react";
import { useToast } from "../../context/ToastContext.js";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

/**
 * Interactive copy-to-clipboard button with tactile icon animation and toast feedback.
 */
function CopyButton({ text, label, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast(`Copied ${label || text} to clipboard!`, "info", 2000);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast("Failed to copy to clipboard", "warning", 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy to clipboard"
      className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 font-mono text-[10.5px] transition-all cursor-pointer ${
        copied
          ? "bg-green/15 text-green font-bold"
          : "bg-ink/5 text-ink-soft hover:bg-ink/10 hover:text-ink"
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{label || "Copy"}</span>
        </>
      )}
    </button>
  );
}

export default CopyButton;

