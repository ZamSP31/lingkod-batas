interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  /** Set false to render just the icon, no "Lingkod Batas" text — used on Forgot Password. */
  showWordmark?: boolean;
  /** "vertical" (default) stacks icon over wordmark, centered, for auth screens. "horizontal" sits the wordmark beside the icon, left-aligned, for the dashboard sidebar header. */
  layout?: "vertical" | "horizontal";
}

/**
 * The Lingkod Batas mark: a navy seal referencing the scales-of-justice /
 * document register of PH legal practice, paired with the wordmark.
 * Kept as a single component so the mark stays consistent across the
 * login, register, and dashboard headers.
 */
function BrandMark({
  size = "lg",
  showWordmark = true,
  layout = "vertical",
}: BrandMarkProps) {
  const iconSize =
    size === "lg" ? "h-14 w-14" : size === "md" ? "h-10 w-10" : "h-9 w-9";
  const glyphSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={
        isHorizontal
          ? "flex items-center gap-3"
          : "flex flex-col items-center gap-4"
      }
    >
      <div
        className={`${iconSize} flex shrink-0 items-center justify-center rounded-2xl bg-navy-900 shadow-sm shadow-navy-950/20`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`${glyphSize} text-parchment-100`}
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
        <div className={isHorizontal ? "text-left" : "text-center"}>
          <h1
            className={`font-display font-semibold text-navy-950 ${
              isHorizontal ? "text-lg" : "text-2xl"
            }`}
          >
            Lingkod Batas
          </h1>
        </div>
      )}
    </div>
  );
}

export default BrandMark;
