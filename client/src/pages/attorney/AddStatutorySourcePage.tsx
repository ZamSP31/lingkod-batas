import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.js";
import TextField from "../../components/ui/TextField.js";
import FileDropzone from "../../components/attorney/FileDropzone.js";
import {
  FileIcon,
  ExternalLinkIcon,
  TrashIcon,
} from "../../components/attorney/icons.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import {
  createStatutorySource,
  updateStatutorySource,
  getStatutorySourceById,
  extractTextFromFile,
} from "../../services/kbService.js";
import { formatFileSize } from "../../utils/format.js";

interface FormErrors {
  citation?: string;
  title?: string;
  sourceType?: string;
  provisionText?: string;
  form?: string;
}

/**
 * Add / Edit Statutory Source Page for attorneys.
 * Supports manual entry or document upload (PDF, PNG, JPEG, TXT) with automatic
 * OCR text extraction and Cloudinary permanent storage.
 */
function AddStatutorySourcePage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [citation, setCitation] = useState("");
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("dole_department_order");
  const [tag, setTag] = useState("wage_and_hours");
  const [provisionText, setProvisionText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Existing file state for edit mode
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingFileSize, setExistingFileSize] = useState<number | null>(null);
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  const [isExtracting, setIsExtracting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Load existing source data when in Edit mode
  useEffect(() => {
    if (!isEditMode || !id || !token) return;

    let isMounted = true;
    setIsLoadingExisting(true);

    getStatutorySourceById(id, token)
      .then((source) => {
        if (!isMounted) return;
        setCitation(source.citation || "");
        setTitle(source.title || "");
        setSourceType(source.sourceType || "dole_department_order");
        if (source.tags && source.tags.length > 0 && source.tags[0]) {
          setTag(source.tags[0]);
        }
        setProvisionText(source.provisionText || "");
        if (source.fileUrl && source.fileName) {
          setExistingFileName(source.fileName);
          setExistingFileUrl(source.fileUrl);
          setExistingFileSize(source.fileSize || null);
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load statutory source.";
        setErrors({ form: msg });
      })
      .finally(() => {
        if (isMounted) setIsLoadingExisting(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, token]);

  // Handle file selection and automated text extraction
  async function handleFileChange(file: File | null) {
    setSelectedFile(file);
    if (!file || !token) return;

    try {
      setIsExtracting(true);
      showToast("Extracting text from legal document via OCR...", "info");

      const extracted = await extractTextFromFile(file, token);

      if (extracted.text) {
        setProvisionText(extracted.text);
        showToast(
          `Extracted ${extracted.text.length} characters from ${file.name}!`,
          "success",
        );
      }

      // Pre-fill citation or title if empty
      if (!citation.trim() && extracted.suggestedCitation) {
        setCitation(extracted.suggestedCitation);
      }
      if (!title.trim() && extracted.suggestedTitle) {
        setTitle(extracted.suggestedTitle);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "OCR extraction failed. You can paste the text manually.";
      showToast(msg, "warning");
    } finally {
      setIsExtracting(false);
    }
  }

  function validate(): FormErrors {
    const nextErrors: FormErrors = {};
    if (!citation.trim())
      nextErrors.citation =
        "Enter an official citation (e.g. DOLE D.O. 174-17).";
    if (!title.trim()) nextErrors.title = "Enter a title or subject doctrine.";
    if (!provisionText.trim() && !selectedFile)
      nextErrors.provisionText =
        "Enter the verbatim provision text or upload a document.";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!token) {
      setErrors({
        form: "You must be logged in as an attorney to perform this action.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("citation", citation.trim());
      formData.append("title", title.trim());
      formData.append("sourceType", sourceType);
      formData.append("provisionText", provisionText.trim());
      formData.append("tags", JSON.stringify([tag]));

      if (selectedFile) {
        formData.append("documentFile", selectedFile);
      }

      if (removeExistingFile) {
        formData.append("removeFile", "true");
      }

      if (isEditMode && id) {
        await updateStatutorySource(id, formData, token);
        showToast(`Updated "${citation.trim()}" successfully! ⚖️`, "success");
      } else {
        await createStatutorySource(formData, token);
        showToast(
          `Added "${citation.trim()}" to statutory corpus! ⚖️`,
          "success",
        );
      }

      navigate("/attorney/statutory-corpus");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to save statutory source.";
      setErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingExisting) {
    return (
      <div className="max-w-2xl animate-fade-in-up py-12 text-center">
        <p className="font-mono text-sm text-ink-soft">
          Loading statutory source details...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in-up pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium tracking-[-0.01em] text-navy-deep">
            {isEditMode ? "Edit statutory source" : "Add statutory source"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {isEditMode
              ? "Modify this Philippine legal reference, citations, or attached source documents."
              : "Register a new Philippine legal reference for the RAG AI to cite and ground risk evaluations against."}
          </p>
        </div>
      </div>

      {errors.form && (
        <div className="mt-4 rounded-[6px] border border-maroon/30 bg-maroon/5 p-3.5 text-xs text-maroon font-mono">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        {/* Document File Upload Dropzone */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-navy-deep">
              Attach Legal Document (PDF / Scan)
            </label>
            <span className="font-mono text-[10.5px] text-ink-soft">
              Auto-extracts verbatim text via OCR
            </span>
          </div>

          <FileDropzone
            file={selectedFile}
            onFileChange={handleFileChange}
            supportsText="SUPPORTS PDF, PNG, JPEG, TXT · MAX 20MB · AUTO-EXTRACTS VERBATIM TEXT"
          />

          {isExtracting && (
            <div className="mt-2.5 flex items-center gap-2 rounded-[6px] bg-navy/5 px-3 py-2 text-xs font-medium text-navy">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-navy border-t-transparent" />
              <span>Extracting legal text from document via OCR engine...</span>
            </div>
          )}

          {/* Existing uploaded file indicator in edit mode */}
          {existingFileUrl && !selectedFile && !removeExistingFile && (
            <div className="mt-3 flex items-center justify-between rounded-[8px] border border-line bg-parchment/60 p-3.5 text-xs">
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-navy shrink-0" />
                <div>
                  <p className="font-semibold text-ink m-0">
                    {existingFileName}
                  </p>
                  {existingFileSize && (
                    <p className="font-mono text-[11px] text-ink-soft m-0">
                      {formatFileSize(existingFileSize)} · Currently linked
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-navy border border-line hover:border-navy"
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  View PDF
                </a>
                <button
                  type="button"
                  onClick={() => setRemoveExistingFile(true)}
                  className="inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 font-mono text-[11px] font-medium text-maroon border border-line hover:border-maroon cursor-pointer"
                  title="Remove this attached file"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          )}

          {removeExistingFile && (
            <div className="mt-2 flex items-center justify-between rounded-[6px] bg-maroon/10 px-3 py-2 text-xs text-maroon">
              <span>Attached document will be removed upon saving.</span>
              <button
                type="button"
                onClick={() => setRemoveExistingFile(false)}
                className="underline font-semibold cursor-pointer"
              >
                Undo
              </button>
            </div>
          )}
        </div>

        {/* Citation and Title */}
        <div className="flex flex-col gap-4">
          <TextField
            label="Official Citation"
            placeholder="e.g. DOLE Department Order No. 174-17, Sec. 4"
            value={citation}
            onChange={(event) => setCitation(event.target.value)}
            error={errors.citation}
          />

          <TextField
            label="Title / Subject Doctrine"
            placeholder="e.g. Rules Implementing Articles 106 to 109 of the Labor Code"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            error={errors.title}
          />
        </div>

        {/* Source Type and Category Tag */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="sourceType"
              className="mb-1.5 block font-mono text-[11px] font-medium uppercase text-ink-soft"
            >
              Source Type
            </label>
            <select
              id="sourceType"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full rounded-[6px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
            >
              <option value="labor_code">Labor Code</option>
              <option value="dole_department_order">
                DOLE Department Order
              </option>
              <option value="dole_advisory">DOLE Advisory</option>
              <option value="republic_act">Republic Act / Civil Code</option>
              <option value="other">Supreme Court Jurisprudence</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="tag"
              className="mb-1.5 block font-mono text-[11px] font-medium uppercase text-ink-soft"
            >
              Primary Category Tag
            </label>
            <select
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full rounded-[6px] border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-navy focus:outline-none"
            >
              <option value="wage_and_hours">Wage &amp; Hours</option>
              <option value="termination">Termination &amp; Due Process</option>
              <option value="non_compete">Non-Compete</option>
              <option value="confidentiality">Confidentiality</option>
              <option value="liability_waiver">Liability Waiver</option>
              <option value="contracting_and_subcontracting">
                Contracting
              </option>
              <option value="other">General / Other</option>
            </select>
          </div>
        </div>

        {/* Verbatim Provision Text Area */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="provisionText"
              className="block font-mono text-[11px] font-medium uppercase text-ink-soft"
            >
              Verbatim Provision Text
            </label>
            {provisionText && (
              <span className="font-mono text-[10.5px] text-ink-soft">
                {provisionText.length} characters
              </span>
            )}
          </div>
          <textarea
            id="provisionText"
            rows={7}
            placeholder="Paste or auto-extract the verbatim statutory article, section, or judicial ruling text..."
            value={provisionText}
            onChange={(e) => setProvisionText(e.target.value)}
            className="w-full rounded-[6px] border border-line bg-white p-3 font-serif text-[13.5px] leading-relaxed text-ink placeholder:text-[#a39c8e] focus:border-navy focus:outline-none"
          />
          {errors.provisionText && (
            <p className="mt-1 text-xs text-maroon font-mono">
              {errors.provisionText}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={() => navigate("/attorney/statutory-corpus")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            fullWidth={false}
            isLoading={isSubmitting}
            className="bg-maroon hover:bg-maroon-bright text-parchment font-semibold px-6"
          >
            {isEditMode ? "Save changes" : "Register source"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddStatutorySourcePage;
