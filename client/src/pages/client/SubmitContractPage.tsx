import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import FileDropzone from "../../components/attorney/FileDropzone.js";
import { mockAttorneyDirectory } from "../../mocks/attorney.js";

/**
 * Client "Submit contract" page matching Screen 9 of the mockup.
 */
function SubmitContractPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<string>("");
  const [selectedAttorneyIndex, setSelectedAttorneyIndex] = useState(0);
  const [isChangingAttorney, setIsChangingAttorney] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentAttorney = mockAttorneyDirectory[selectedAttorneyIndex] ?? mockAttorneyDirectory[0];
  const canSubmit = file !== null && contractType !== "" && !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setSubmitError("Select a file and a contract type before continuing.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      navigate("/client");
    }, 900);
  }

  return (
    <div className="max-w-[600px]">
      <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep mb-2">
        Submit contract
      </h1>
      <p className="text-[14px] leading-[1.5] text-ink-soft mb-7.5">
        Your contract will be read by AI, then reviewed and finalized by your
        attorney before any results are shared with you.
      </p>

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
            className="mb-2 block font-mono text-[11px] font-medium tracking-[0.05em] text-ink-soft uppercase"
          >
            Contract type
          </label>
          <div className="relative">
            <select
              id="contractType"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full appearance-none rounded-[6px] border border-line bg-white px-3.5 py-3 pr-10 text-sm text-ink focus:border-navy focus:outline-none"
            >
              <option value="">Select type</option>
              <option value="employment">Employment</option>
              <option value="freelance">Freelance / service</option>
              <option value="vendor">Vendor agreement</option>
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
            Helps the system apply the right clause classification model.
          </p>
        </div>

        {/* Assign to Attorney Card */}
        <div className="mt-6.5">
          <label className="mb-2 block font-mono text-[11px] font-medium tracking-[0.05em] text-ink-soft uppercase">
            Assign to attorney
          </label>
          <div className="flex items-center justify-between rounded-[6px] border border-line bg-white p-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                >
                  <path d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2Z" />
                </svg>
              </div>
              <div>
                <div className="text-[13.5px] font-semibold text-ink">
                  {currentAttorney?.displayName ?? "Atty. Dela Cruz"}
                </div>
                <div className="font-mono text-[10.5px] text-ink-soft">
                  {currentAttorney?.note ?? "LAST WORKED WITH YOU"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextIdx = (selectedAttorneyIndex + 1) % mockAttorneyDirectory.length;
                setSelectedAttorneyIndex(nextIdx);
              }}
              className="text-[12px] font-semibold text-maroon hover:text-maroon-bright cursor-pointer"
            >
              Change
            </button>
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">
            You can request a different attorney after upload if needed.
          </p>
        </div>

        {submitError && (
          <p className="mt-3 font-mono text-xs text-maroon">{submitError}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 w-full rounded-[6px] bg-maroon p-3.5 text-[14.5px] font-semibold text-parchment transition-colors hover:bg-maroon-bright disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? "Uploading and analyzing…" : "Upload and analyze"}
        </button>

        {/* Pipeline Preview */}
        <div className="mt-6.5 flex border-t border-dashed border-line pt-5.5">
          <div className="relative flex-1 text-center after:absolute after:-right-1 after:top-0.5 after:text-sm after:text-line after:content-['→']">
            <span className="mb-1 block font-mono text-[10px] tracking-[0.05em] text-maroon">
              01
            </span>
            <span className="px-2 text-[11.5px] leading-[1.3] text-ink-soft">
              Text extracted &amp; OCR'd
            </span>
          </div>
          <div className="relative flex-1 text-center after:absolute after:-right-1 after:top-0.5 after:text-sm after:text-line after:content-['→']">
            <span className="mb-1 block font-mono text-[10px] tracking-[0.05em] text-maroon">
              02
            </span>
            <span className="px-2 text-[11.5px] leading-[1.3] text-ink-soft">
              Clauses checked against statute
            </span>
          </div>
          <div className="relative flex-1 text-center">
            <span className="mb-1 block font-mono text-[10px] tracking-[0.05em] text-maroon">
              03
            </span>
            <span className="px-2 text-[11.5px] leading-[1.3] text-ink-soft">
              Queued for attorney review
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SubmitContractPage;