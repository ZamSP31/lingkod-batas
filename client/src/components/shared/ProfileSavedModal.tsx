import { useEffect, useRef } from "react";

interface ProfileSavedModalProps {
  open: boolean;
  onClose: () => void;
  details: {
    fullName: string;
    email: string;
    contactNumber?: string | undefined;
    passwordChanged?: boolean | undefined;
    role?: string | undefined;
  };
}

/**
 * Modal dialog confirming that account settings and credentials
 * have been successfully validated and persisted to the database.
 */
function ProfileSavedModal({ open, onClose, details }: ProfileSavedModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/60 px-4 py-8 backdrop-blur-xs animate-fade-in-up"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-modal-title"
        tabIndex={-1}
        className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-[10px] border border-line bg-white shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-line bg-navy-deep px-6 py-4.5 text-parchment">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green/20 text-green border border-green/40">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="font-mono text-[10px] font-semibold text-gold uppercase tracking-wider">
              Database Synced
            </div>
            <h2
              id="saved-modal-title"
              className="font-serif text-[18px] font-medium text-parchment leading-tight"
            >
              Account settings saved
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-[13px] text-ink">
          <p className="text-ink-soft mb-4 leading-relaxed">
            Your profile details and security credentials have been successfully
            updated and stored in the database.
          </p>

          <div className="rounded-[8px] border border-line bg-parchment-light/40 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-2.5 font-semibold">
              Updated Account Summary
            </div>
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between items-baseline gap-2">
                <dt className="text-ink-soft shrink-0">Name:</dt>
                <dd className="font-medium text-ink truncate text-right max-w-[260px]">
                  {details.fullName}
                </dd>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <dt className="text-ink-soft shrink-0">Email:</dt>
                <dd className="font-mono text-ink truncate text-right max-w-[260px]">
                  {details.email}
                </dd>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <dt className="text-ink-soft shrink-0">Contact Number:</dt>
                <dd className="font-mono text-ink">
                  {details.contactNumber || "Not provided"}
                </dd>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <dt className="text-ink-soft shrink-0">Password Security:</dt>
                <dd
                  className={`font-medium ${
                    details.passwordChanged ? "text-green" : "text-ink-soft"
                  }`}
                >
                  {details.passwordChanged ? "✓ Changed" : "Unchanged"}
                </dd>
              </div>
              {details.role && (
                <div className="flex justify-between items-baseline gap-2">
                  <dt className="text-ink-soft shrink-0">Account Role:</dt>
                  <dd className="capitalize text-navy-deep font-semibold">
                    {details.role}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-line bg-parchment/30 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[5px] bg-maroon px-5 py-2 text-[13px] font-semibold text-parchment hover:bg-maroon-bright transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSavedModal;
