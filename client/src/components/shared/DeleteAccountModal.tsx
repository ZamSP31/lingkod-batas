import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

/**
 * Modern, branded Delete Account Confirmation Modal for Lingkod Batas clients.
 * Replaces default browser window.confirm with an accessible, high-trust dialog.
 * Requires safety typing "DELETE" to prevent accidental data erasure.
 */
function DeleteAccountModal({
  open,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteAccountModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmText("");
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose, isDeleting]);

  if (!open) return null;

  const isConfirmed = confirmText.trim() === "DELETE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 px-4 py-8 backdrop-blur-xs animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        tabIndex={-1}
        className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl outline-none animate-fade-in-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-maroon/15 bg-maroon/5 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon/15 text-maroon ring-1 ring-maroon/20">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10.5px] font-semibold text-maroon uppercase tracking-wider">
                Permanent Action · Irreversible
              </div>
              <h2
                id="delete-account-title"
                className="font-serif text-[18px] font-medium text-navy-deep leading-tight mt-0.5"
              >
                Delete Account &amp; Data
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft hover:bg-parchment hover:text-ink cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-xs text-ink space-y-4">
          <div className="rounded-xl border border-maroon/20 bg-maroon/5 p-4 text-maroon flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-semibold mb-1">This action cannot be undone.</p>
              <p className="text-maroon/90">
                Permanently deleting your account will erase your profile credentials, stop any active legal reviews, and purge all uploaded contracts in accordance with your Right to Erasure under the Data Privacy Act (RA 10173).
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmDeleteInput"
              className="block font-semibold text-navy-deep mb-1.5"
            >
              To confirm deletion, type <span className="font-mono font-bold text-maroon">DELETE</span> below:
            </label>
            <input
              id="confirmDeleteInput"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isDeleting}
              className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-ink focus:border-maroon focus:outline-none focus:ring-2 focus:ring-maroon/15 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-line bg-parchment/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink-soft hover:bg-parchment hover:text-ink transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={!isConfirmed || isDeleting}
            className="flex items-center justify-center gap-2 rounded-xl bg-maroon px-5 py-2.5 text-xs font-semibold text-parchment transition-all hover:bg-maroon-bright active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            {isDeleting ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin text-parchment"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting Account…
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Permanently Delete Account
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountModal;
