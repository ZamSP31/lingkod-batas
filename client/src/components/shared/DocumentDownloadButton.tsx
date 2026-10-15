import { useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { downloadContractDocument } from "../../services/contractService.js";

export default function DocumentDownloadButton({ contractId }: { contractId: string }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  async function download() {
    if (!token || busy) return;
    setBusy(true);
    try {
      const blob = await downloadContractDocument(contractId, token);
      const extension = blob.type === "application/pdf" ? "pdf" : blob.type === "image/png" ? "png" : "jpg";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `contract-${contractId}.${extension}`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { showToast(error instanceof Error ? error.message : "Document download failed.", "warning"); }
    finally { setBusy(false); }
  }
  return <button type="button" disabled={!token || busy} onClick={download}
    className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-navy-deep disabled:opacity-50">
    {busy ? "Downloading..." : "Download original document"}
  </button>;
}
