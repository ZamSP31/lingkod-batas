import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visually-hidden label — always required for a11y even when the row itself provides visible context. */
  label: string;
}

/**
 * A themed checkbox used for row selection in contract/document tables.
 * The label is visually hidden by default since row content (contract
 * title, etc.) already provides visible context — pass a specific
 * label like "Select Freelance web dev agreement" rather than "Select".
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", ...inputProps }, ref) => {
    return (
      <label className="inline-flex cursor-pointer items-center">
        <input
          ref={ref}
          type="checkbox"
          className={`h-4 w-4 cursor-pointer rounded border-hairline text-navy-900 accent-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-navy-700/40 ${className}`}
          {...inputProps}
        />
        <span className="sr-only">{label}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
