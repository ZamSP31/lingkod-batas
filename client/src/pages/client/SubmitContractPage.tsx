import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import FileDropzone from "../../components/attorney/FileDropzone.js";
import { useAuth } from "../../context/AuthContext.js";
import { submitContract } from "../../services/contractService.js";

/**
 * Modern Client "Submit contract" page matching Lingkod Batas design standards.
 */
function SubmitContractPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<string>("regular");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = file !== null && contractType !== "" && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !file) {
      setSubmitError("Please select a valid contract file and specify the contract type.");
      return;
    }

    if (!token) {
      setSubmitError("You must be logged in to submit a contract.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("contractFile", file);
      const derivedTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");
      formData.append("title", derivedTitle || "Employment Agreement");
      formData.append("contractType", contractType || "regular");

      await submitContract(formData, token);
      navigate("/client");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to upload contract.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-[720px] pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-medium tracking-tight text-navy-deep mb-2">
          Submit contract for review
        </h1>
        <p className="text-xs text-ink-soft leading-relaxed max-w-[580px]">
          Upload your employment contract for preliminary Labor Code screening. All personal identifying data is redacted before attorney gatekeeping.
        </p>
      </div>

      {/* Main Submission Card */}
      <div className="rounded-2xl border border-line bg-white p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* File Upload Zone */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-soft">
              Contract document
            </label>
            <FileDropzone
              file={file}
              onFileChange={setFile}
              supportsText="SUPPORTS PDF, PNG, JPEG · SCANNED OR DIGITAL · MAX 20MB"
            />
          </div>

          {/* Contract Classification Field */}
          <div>
            <label
              htmlFor="contractType"
              className="mb-2 block text-xs font-semibold text-ink-soft"
            >
              Contract classification
            </label>
            <div className="relative">
              <select
                id="contractType"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink focus:border-navy-deep focus:outline-none focus:ring-2 focus:ring-navy-deep/10 transition-all shadow-2xs"
              >
                <option value="regular">Regular Employment Contract</option>
                <option value="probationary">Probationary Employment Contract</option>
                <option value="project_based">Project-Based Employment Contract</option>
                <option value="fixed_term">Fixed-Term Employment Contract</option>
              </select>
              <svg
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="mt-1.5 text-[11.5px] text-ink-soft/70">
              Aligns clause extraction with the relevant statutory rules (e.g. Art. 296 for probationary limits).
            </p>
          </div>

          {/* Assigned Reviewing Counsel */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink-soft">
              Supervising legal counsel
            </label>
            <div className="flex items-center justify-between rounded-xl border border-line bg-parchment/30 p-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-navy-deep font-bold text-xs shadow-xs ring-2 ring-white">
                  DJ
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy-deep flex items-center gap-1.5">
                    Atty. Danielito Jimenez
                    <span className="rounded-full bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 text-[10px] ring-1 ring-emerald-600/15">
                      Verified
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-ink-soft mt-0.5">
                    "Pinoy Street Lawyer" · IBP Roll No. 67890
                  </div>
                </div>
              </div>
              <span className="hidden sm:inline-flex rounded-full bg-navy/10 px-2.5 py-1 text-[11px] font-semibold text-navy-deep">
                Direct Gatekeeper
              </span>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="rounded-xl border border-maroon/20 bg-maroon/5 p-3.5 text-xs text-maroon font-medium">
              {submitError}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-maroon py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-parchment shadow-xs hover:bg-maroon-bright active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-parchment" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading &amp; initiating compliance scan…
              </>
            ) : (
              "Submit contract for review"
            )}
          </button>

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-ink-soft/70">
            <svg className="w-3.5 h-3.5 text-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>PII is protected and sanitized under RA 10173 prior to analysis</span>
          </div>
        </form>

        {/* Pipeline Process Steps */}
        <div className="mt-8 border-t border-line pt-6">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft/60 mb-4 text-center">
            Verification Pipeline Sequence
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-line bg-parchment/20 p-3">
              <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                STAGE 01
              </span>
              <p className="text-xs font-semibold text-navy-deep">OCR &amp; Sanitization</p>
              <p className="text-[11px] text-ink-soft mt-0.5">Sensitive PII redacted</p>
            </div>
            <div className="rounded-xl border border-line bg-parchment/20 p-3">
              <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                STAGE 02
              </span>
              <p className="text-xs font-semibold text-navy-deep">Labor Code Screening</p>
              <p className="text-[11px] text-ink-soft mt-0.5">8 risk categories analyzed</p>
            </div>
            <div className="rounded-xl border border-line bg-parchment/20 p-3">
              <span className="inline-block font-mono text-xs font-bold text-maroon mb-1">
                STAGE 03
              </span>
              <p className="text-xs font-semibold text-navy-deep">Counsel Certification</p>
              <p className="text-[11px] text-ink-soft mt-0.5">Attorney signs off report</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitContractPage;
