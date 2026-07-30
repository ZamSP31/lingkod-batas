interface BrandMarkProps {
  size?: "md" | "lg";
  /** Set false to render just the icon, no "Lingkod Batas" text — used on Forgot Password. */
  showWordmark?: boolean;
}

/**
 * The Lingkod Batas mark: a navy seal referencing the scales-of-justice /
 * document register of PH legal practice, paired with the wordmark.
 * Kept as a single component so the mark stays consistent across the
 * login, register, and dashboard headers.
 */
function BrandMark({ size = "lg", showWordmark = true }: BrandMarkProps) {
  const iconSize = size === "lg" ? "h-14 w-14" : "h-10 w-10";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`${iconSize} flex items-center justify-center rounded-2xl bg-navy-900 shadow-sm shadow-navy-950/20`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6 text-parchment-100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3l7 3.5v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5v-5L12 3z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11.5" r="1.6" fill="currentColor" />
        </svg>
      </div>
      {showWordmark && (
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-navy-950">
            Lingkod Batas
          </h1>
        </div>
      )}
    </div>
  );
}

export default BrandMark;
