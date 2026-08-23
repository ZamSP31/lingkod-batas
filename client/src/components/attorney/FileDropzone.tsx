import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { FileIcon, XIcon } from "./icons.js";
import { formatFileSize } from "../../utils/format.js";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  supportsText?: string;
}

/**
 * Drag-and-drop upload zone styled with Lingkod Batas maroon tint and circular icon.
 */
function FileDropzone({
  file,
  onFileChange,
  supportsText = "SUPPORTS PDF · SCANNED OR DIGITAL · MAX 20MB",
}: FileDropzoneProps) {
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
        className={`flex flex-col items-center justify-center rounded-[10px] border-[1.5px] border-dashed px-6 py-12 text-center transition-all ${
          isDraggingOver
            ? "border-maroon bg-maroon/[0.08]"
            : error
              ? "border-maroon/60 bg-maroon/5"
              : "border-maroon/35 bg-maroon/[0.03] hover:border-maroon hover:bg-maroon/[0.06]"
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
          <div className="flex w-full max-w-sm items-center gap-3 rounded-[6px] border border-line bg-white px-4 py-3 text-left">
            <FileIcon className="h-6 w-6 shrink-0 text-navy" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {file.name}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove selected file"
              className="shrink-0 rounded-full p-1 text-ink-soft hover:bg-parchment hover:text-ink cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4.5 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-line bg-white shadow-2xs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[22px] w-[22px] text-maroon"
              >
                <path d="M14 2H6A2 2 0 004 4V20A2 2 0 006 22H18A2 2 0 0020 20V8Z" />
                <path d="M14 2V8H20" />
                <path d="M12 18V12M9 15L12 12L15 15" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-ink mb-1">
              Drag and drop your file here
            </p>
            <p className="my-3.5 font-mono text-[11px] tracking-[0.05em] text-ink-soft uppercase">
              or
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-[5px] border border-line bg-white px-5 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink cursor-pointer shadow-2xs"
            >
              Browse files
            </button>
          </>
        )}

        <p className="mt-4 font-mono text-[11px] tracking-[0.04em] text-ink-soft uppercase">
          {supportsText}
        </p>
      </div>

      {error && <p className="mt-1.5 font-mono text-xs text-maroon">{error}</p>}
    </div>
  );
}

export default FileDropzone;
