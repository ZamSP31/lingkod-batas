import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import Select from "../../components/ui/Select.js";
import FileDropzone from "../../components/attorney/FileDropzone.js";
import { CONTRACT_TYPE_OPTIONS } from "../../types/contract.js";

/**
 * "Upload contract" — reached from the "Upload contract" button on My
 * contracts (Fig. 3.25). Collects the file plus a contract type, which
 * the backend needs up front to pick the right clause-classification
 * model before OCR/AI analysis begins.
 */
function UploadContractPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = file !== null && contractType !== null && !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setSubmitError("Select a file and a contract type before continuing.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    // TODO: replace with the real POST /api/contracts (multipart upload).
    window.setTimeout(() => {
      setIsSubmitting(false);
      navigate("/attorney");
    }, 900);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-navy-950">
        Upload contract
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        The contract will be read, segmented into clauses, and reviewed for
        risk.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <FileDropzone file={file} onFileChange={setFile} />

        <Select
          label="Contract type"
          placeholder="Select type"
          options={CONTRACT_TYPE_OPTIONS}
          value={contractType}
          onChange={setContractType}
          helperText="Helps the system apply the right clause classification model."
        />

        {submitError && (
          <p className="-mt-3 text-sm text-maroon-600">{submitError}</p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Upload and analyze
        </Button>
      </form>
    </div>
  );
}

export default UploadContractPage;
