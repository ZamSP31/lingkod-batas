interface IconProps {
  className?: string;
}

const base = "h-5 w-5";

export function FolderIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.5 6.5a1.5 1.5 0 011.5-1.5h4l2 2.2h8a1.5 1.5 0 011.5 1.5v8.3a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5V6.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClipboardCheckIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="4.5"
        width="13"
        height="16"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 4.2h6a1 1 0 011 1v1.3H8V5.2a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.7 13l2 2 4.2-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookOpenIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 6.2c-1.4-1.1-3.3-1.7-5.5-1.7-.8 0-1.5.65-1.5 1.45v10.6c0 .8.67 1.35 1.5 1.35 2.2 0 4.1.6 5.5 1.7 1.4-1.1 3.3-1.7 5.5-1.7.83 0 1.5-.55 1.5-1.35V5.95c0-.8-.7-1.45-1.5-1.45-2.2 0-4.1.6-5.5 1.7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.2v13.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserCircleIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.3 18.2c.9-2.35 2.9-3.6 5.7-3.6s4.8 1.25 5.7 3.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogOutIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9.5 4.5H6a1.5 1.5 0 00-1.5 1.5v12A1.5 1.5 0 006 19.5h3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 8l4 4-4 4M18.2 12H9.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UploadCloudIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M7.2 17.5a3.7 3.7 0 01-.6-7.35 5 5 0 019.6-1.55 4 4 0 01-.4 8.9H7.2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.5V9.8M9.6 12.2l2.4-2.4 2.4 2.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InboxIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 12.5l2.3-6.3A1.5 1.5 0 017.7 5.2h8.6a1.5 1.5 0 011.4 1l2.3 6.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 12.5h4.6l1 2.2h4.8l1-2.2H20v5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5v-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
