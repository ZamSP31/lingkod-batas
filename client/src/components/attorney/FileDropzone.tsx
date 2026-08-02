import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { FileIcon, UploadCloudIcon, XIcon } from "./icons.js";
import { formatFileSize } from "../../utils/format.js";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB, matches the mockup's stated limit

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

/**
 * Drag-and-drop (or click-to-browse) contract upload target. Validates
 * type and size client-side before accepting a file — this covers the
 * "unsupported file type" / "file too large" cases from the test plan
 * (SE01–SE06) with immediate feedback, ahead of whatever the server
 * re-validates on submit.
 */
function FileDropzone({ file, onFileChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndAccept(candidate: File) {
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError("Unsupported file type. Upload a PDF, PNG, or JPEG.");
      onFileChange(null);
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setError("File is too large. Maximum size is 20MB.");
      onFileChange(null);
      return;
    }
    setError(null);
    onFileChange(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) validateAndAccept(dropped);
  }

  function handleBrowseChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (picked) validateAndAccept(picked);
    event.target.value = "";
  }

  function handleRemove() {
    setError(null);
    onFileChange(null);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDraggingOver
            ? "border-navy-700 bg-navy-900/5"
            : error
              ? "border-maroon-300 bg-maroon-600/5"
              : "border-hairline bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleBrowseChange}
          className="sr-only"
          aria-label="Upload contract file"
        />

        {file ? (
          <div className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-hairline bg-parchment-50 px-4 py-3 text-left">
            <FileIcon className="h-6 w-6 shrink-0 text-navy-800" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">
                {file.name}
              </p>
              <p className="text-xs text-ink-400">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove selected file"
              className="shrink-0 rounded-full p-1 text-ink-400 hover:bg-navy-900/5 hover:text-ink-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloudIcon className="h-8 w-8 text-navy-800" />
            <div>
              <p className="text-sm font-semibold text-ink-900">
                Drag and drop your file here
              </p>
              <p className="mt-1 text-xs text-ink-400">or</p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-hairline bg-white px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-parchment-100"
            >
              Browse files
            </button>
          </>
        )}

        <p className="text-xs text-ink-400">
          Supports PDF · Scanned or digital · Max 20MB
        </p>
      </div>

      {error && <p className="mt-1.5 text-xs text-maroon-600">{error}</p>}
    </div>
  );
}

export default FileDropzone;
