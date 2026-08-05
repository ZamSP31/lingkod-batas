import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import Select from "../../components/ui/Select.js";
import FileDropzone from "../../components/attorney/FileDropzone.js";
import { CONTRACT_TYPE_OPTIONS } from "../../types/contract.js";
import { mockAttorneyDirectory } from "../../mocks/attorney.js";

const ATTORNEY_OPTIONS = mockAttorneyDirectory.map((attorney) => ({
  value: attorney.id,
  label: attorney.note
    ? `${attorney.displayName} \u00b7 ${attorney.note}`
    : attorney.displayName,
}));

/**
 * "Submit contract" — reached from the "Submit contract" button on the
 * client's My contracts dashboard (Fig. 3.25b). Collects the file, a
 * contract type (drives which clause-classification model applies),
 * and the attorney to assign the review to.
 */
function SubmitContractPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<string | null>(null);
  const [attorneyId, setAttorneyId] = useState<string | null>(
    mockAttorneyDirectory[0]?.id ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit =
    file !== null && contractType !== null && attorneyId !== null && !isSubmitting;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setSubmitError(
        "Select a file, a contract type, and an attorney before continuing.",
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    // TODO: replace with the real POST /api/contracts (multipart upload).
    window.setTimeout(() => {
      setIsSubmitting(false);
      navigate("/client");
    }, 900);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-navy-950">
        Upload Contract
      </h1>
      <p className="mt-1 text-sm text-ink-600">
        Your contract will be read by AI, then reviewed and finalized by
        your attorney.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <FileDropzone file={file} onFileChange={setFile} />

        <Select
          label="Contract Type"
          placeholder="Select Type"
          options={CONTRACT_TYPE_OPTIONS}
          value={contractType}
          onChange={setContractType}
        />

        <Select
          label="Assign to Attorney"
          placeholder="Select an Attorney"
          options={ATTORNEY_OPTIONS}
          value={attorneyId}
          onChange={setAttorneyId}
          helperText="You can request a different attorney after upload if needed."
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

export default SubmitContractPage;