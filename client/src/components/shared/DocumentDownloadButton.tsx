import { useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { downloadContractDocument } from "../../services/contractService.js";

interface DocumentDownloadButtonProps {
  contractId: string;
  className?: string;
  label?: string;
}

export default function DocumentDownloadButton({
  contractId,
  className,
  label = "Download original document",
}: DocumentDownloadButtonProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!token || busy) return;
    setBusy(true);
    try {
      const blob = await downloadContractDocument(contractId, token);
      const extension =
        blob.type === "application/pdf"
          ? "pdf"
          : blob.type === "image/png"
            ? "png"
            : "jpg";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `contract-${contractId}.${extension}`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Document download failed.",
        "warning",
      );
    } finally {
      setBusy(false);
    }
  }

  const defaultClasses =
    "inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-navy-deep hover:bg-parchment/60 hover:border-navy-deep/20 transition-all shadow-2xs disabled:opacity-50 cursor-pointer";

  return (
    <button
      type="button"
      disabled={!token || busy}
      onClick={download}
      className={className ?? defaultClasses}
    >
      <Download className="w-3.5 h-3.5 shrink-0 text-navy-deep" />
      <span>{busy ? "Downloading…" : label}</span>
    </button>
  );
}

