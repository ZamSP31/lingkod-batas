interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  /** Set false to render just the icon, no "Lingkod Batas" text — used on Forgot Password. */
  showWordmark?: boolean;
  /** "vertical" (default) stacks icon over wordmark, centered, for auth screens. "horizontal" sits the wordmark beside the icon, left-aligned, for the dashboard sidebar header. */
  layout?: "vertical" | "horizontal";
  /** "light" (default) for parchment background, "dark" for navy-deep sidebar background */
  theme?: "light" | "dark";
}

/**
 * The Lingkod Batas mark: a legal shield paired with the gold checkmark/accent
 * and Fraunces display typography.
 */
function BrandMark({
  size = "lg",
  showWordmark = true,
  layout = "vertical",
  theme = "light",
}: BrandMarkProps) {
  const iconSize =
    size === "lg" ? "h-14 w-14" : size === "md" ? "h-10 w-10" : "h-7 w-7";
  const glyphSize =
    size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-7 w-7";
  const isHorizontal = layout === "horizontal";
  const isDark = theme === "dark";

  return (
    <div
      className={
        isHorizontal
          ? "flex items-center gap-2.5"
          : "flex flex-col items-center gap-4"
      }
    >
      <div
        className={`${iconSize} flex shrink-0 items-center justify-center rounded-[4px] border ${
          isDark
            ? "border-parchment/20 bg-parchment/8"
            : "border-line bg-navy text-parchment"
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={glyphSize}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L4 6V12C4 17 7.5 21 12 22C16.5 21 20 17 20 12V6L12 2Z"
            stroke={isDark ? "#F2ECDF" : "#F2ECDF"}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 12L11 14L15 10"
            stroke="#B08D4F"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showWordmark && (
        <div className={isHorizontal ? "text-left" : "text-center"}>
          <span
            className={`font-sans font-semibold tracking-tight ${
              isDark ? "text-parchment" : "text-navy-deep"
            } ${isHorizontal ? "text-base" : "text-2xl font-serif"}`}
          >
            Lingkod Batas
          </span>
        </div>
      )}
    </div>
  );
}

export default BrandMark;
