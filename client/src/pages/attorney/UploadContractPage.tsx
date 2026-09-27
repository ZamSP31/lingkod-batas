import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import FileDropzone from "../../components/attorney/FileDropzone.js";
import { useAuth } from "../../context/AuthContext.js";
import { submitContract } from "../../services/contractService.js";

/**
 * Attorney "Upload contract" page matching Screen 6 of the mockup.
 * Connected to live multipart submission -> OCR -> RAG pipeline.
 */
function UploadContractPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<string>("employment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = file !== null && contractType !== "" && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !file) {
      setSubmitError("Select a file and a contract type before continuing.");
      return;
    }

    if (!token) {
      setSubmitError("You must be logged in to upload contracts.");
      return;
    }

    try {
      setSubmitError(null);
      setIsSubmitting(true);

      const title = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

      const formData = new FormData();
      formData.append("contractFile", file);
      formData.append("title", title);
      formData.append("contractType", contractType);

      await submitContract(formData, token);
      navigate("/attorney");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to upload contract.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-[680px] pb-12 animate-fade-in-up">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[11px] font-semibold text-maroon uppercase tracking-wider">
            Document Ingestion
          </span>
          <span className="text-line">•</span>
          <span className="font-mono text-[11px] text-ink-soft">
            AI Pre-screening &amp; Docketing
          </span>
        </div>
        <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep m-0">
          Upload contract
        </h1>
        <p className="text-[14px] leading-[1.5] text-ink-soft mt-1">
          The contract will be read, segmented into clauses, and reviewed for risk
          before it reaches your queue.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <FileDropzone
            file={file}
            onFileChange={setFile}
            supportsText="SUPPORTS PDF · SCANNED OR DIGITAL · MAX 20MB"
          />

          {/* Contract Type Field */}
          <div className="mt-6.5">
            <label
              htmlFor="contractType"
              className="mb-2 block font-mono text-[11px] font-semibold tracking-[0.05em] text-navy-deep uppercase"
            >
              Contract type
            </label>
            <div className="relative">
              <select
                id="contractType"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-line bg-white px-3.5 py-3 pr-10 text-sm text-ink focus:border-navy focus:outline-none"
              >
                <option value="employment">Employment Agreement</option>
                <option value="vendor">Vendor / Supplier Agreement</option>
                <option value="service">Service &amp; Independent Contractor</option>
                <option value="other">General Commercial Contract</option>
              </select>
              <svg
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">
              Helps the system apply the right Philippine statutory classification model.
            </p>
          </div>

          {submitError && (
            <p className="mt-3 font-mono text-xs text-maroon">{submitError}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-7 w-full rounded-xl bg-maroon p-3.5 text-[14.5px] font-semibold text-parchment transition-all hover:bg-maroon-bright shadow-xs hover:shadow disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Uploading and analyzing…" : "Upload and analyze"}
          </button>

          {/* Pipeline Process Steps */}
          <div className="mt-8 border-t border-line pt-6">
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft/60 mb-4 text-center">
              Processing &amp; Review Pipeline
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-line bg-parchment/20 p-3">
                <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                  STAGE 01
                </span>
                <p className="text-xs font-semibold text-navy-deep">Text OCR Extraction</p>
                <p className="text-[11px] text-ink-soft mt-0.5">High-accuracy parsing</p>
              </div>
              <div className="rounded-xl border border-line bg-parchment/20 p-3">
                <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                  STAGE 02
                </span>
                <p className="text-xs font-semibold text-navy-deep">Statutory RAG Check</p>
                <p className="text-[11px] text-ink-soft mt-0.5">Philippine Labor Code</p>
              </div>
              <div className="rounded-xl border border-line bg-parchment/20 p-3">
                <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                  STAGE 03
                </span>
                <p className="text-xs font-semibold text-navy-deep">Docketed in Queue</p>
                <p className="text-[11px] text-ink-soft mt-0.5">Ready for attorney review</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadContractPage;
