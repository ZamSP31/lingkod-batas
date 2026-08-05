interface IconProps {
  className?: string;
}

const base = "h-5 w-5";

/** Sidebar nav icon for "Track status" — a simple progress/timeline glyph. */
export function TrackStatusIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 12h3.2M10.4 12h9.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8.8" cy="12" r="1.6" fill="currentColor" />
      <path
        d="M4 6.5h9.6M17.2 6.5H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="15.4" cy="6.5" r="1.6" fill="currentColor" />
      <path
        d="M4 17.5h5.2M12.8 17.5H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="11" cy="17.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** The floating search/help affordance in the bottom-right of client screens. */
export function SearchIcon({ className = base }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M15.5 15.5L20 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}