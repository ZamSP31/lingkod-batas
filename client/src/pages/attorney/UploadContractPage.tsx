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
    <div className="max-w-[600px]">
      <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep mb-2">
        Upload contract
      </h1>
      <p className="text-[14px] leading-[1.5] text-ink-soft mb-7.5">
        The contract will be read, segmented into clauses, and reviewed for risk
        before it reaches your queue.
      </p>

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
              <option value="employment">Employment</option>
              <option value="vendor">Vendor / service</option>
              <option value="service">Service</option>
              <option value="other">Other</option>
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

        {submitError && (
          <p className="mt-3 font-mono text-xs text-maroon">{submitError}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
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
              Queued for your review
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UploadContractPage;
