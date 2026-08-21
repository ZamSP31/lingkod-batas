import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  /** Visually-hidden label — the field itself has no visible label in the mockups, but it still needs one for screen readers. */
  label: string;
}

/**
 * A bare, labelless-looking search/filter field — visually just a
 * rounded input, unlike TextField which always renders a visible
 * label above it. Used above list/table views (e.g. Statutory corpus).
 */
function SearchInput({
  label,
  id,
  className = "",
  ...inputProps
}: SearchInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        className={`w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20 ${className}`}
        {...inputProps}
      />
    </div>
  );
}

export default SearchInput;
