import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, ShieldCheck } from "lucide-react";
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
    <div className="w-full max-w-7xl mx-auto pb-12 animate-fade-in-up">
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
          The contract will be read, segmented into clauses, and pre-screened for statutory risk before appearing in your review queue.
        </p>
      </div>

      {/* Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column: Ingestion Form (8 cols) */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-xs">
            <form onSubmit={handleSubmit} className="flex flex-col">
              <FileDropzone
                file={file}
                onFileChange={setFile}
                supportsText="SUPPORTS PDF, PNG, JPEG · SCANNED OR DIGITAL · MAX 20MB"
              />

              {/* Contract Type Field */}
              <div className="mt-6.5">
                <label
                  htmlFor="contractType"
                  className="mb-2 block font-mono text-[11px] font-semibold tracking-[0.05em] text-navy-deep uppercase"
                >
                  Contract classification
                </label>
                <div className="relative">
                  <select
                    id="contractType"
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-line bg-white px-3.5 py-3 pr-10 text-sm text-ink focus:border-navy focus:outline-none"
                  >
                    <option value="employment">Employment Agreement (Regular)</option>
                    <option value="probationary">Probationary Employment Contract</option>
                    <option value="project_based">Project-Based Agreement</option>
                    <option value="fixed_term">Fixed-Term Contract</option>
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <p className="mt-1.5 text-xs text-ink-soft">
                  Helps the system match clauses with the correct statutory rules (such as Art. 296 for probationary limits).
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
            </form>
          </div>
        </div>

        {/* Sidebar Column: Pipeline Details & Best Practices (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Processing Pipeline Stages */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
            <h3 className="font-serif text-sm font-semibold text-navy-deep mb-4 pb-3 border-b border-line flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-maroon" />
              <span>Ingestion Pipeline</span>
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex gap-3">
                <span className="font-mono text-xs font-bold text-maroon shrink-0 mt-0.5">01</span>
                <div>
                  <h4 className="font-semibold text-navy-deep">Text OCR Extraction</h4>
                  <p className="text-[11px] text-ink-soft mt-0.5">High-accuracy PDF text layer parsing and Tesseract fallback.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-xs font-bold text-maroon shrink-0 mt-0.5">02</span>
                <div>
                  <h4 className="font-semibold text-navy-deep">Statutory RAG Audit</h4>
                  <p className="text-[11px] text-ink-soft mt-0.5">Philippine Labor Code &amp; DOLE statutory grounding.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-xs font-bold text-maroon shrink-0 mt-0.5">03</span>
                <div>
                  <h4 className="font-semibold text-navy-deep">Docket Queue Release</h4>
                  <p className="text-[11px] text-ink-soft mt-0.5">Assigned to your queue for human-in-the-loop validation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines Card */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
            <h3 className="font-serif text-sm font-semibold text-navy-deep mb-3 pb-2 border-b border-line flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-deep" />
              <span>Attorney Ingestion Specs</span>
            </h3>
            <ul className="space-y-2 text-xs text-ink-soft">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Both digital contracts and clear physical photo scans are supported.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Max file size: 20MB per contract docket.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Raw AI risk scores are automatically held until your final review sign-off.</span>
              </li>
            </ul>
          </div>

          {/* Legal Ethics Badge */}
          <div className="rounded-2xl border border-line bg-parchment/40 p-5 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-navy-deep">
                  Code of Professional Responsibility
                </h4>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                  Automated risk flags serve strictly as advisory assistance. Final legal liability and counsel verification rest solely with the reviewing counsel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadContractPage;
