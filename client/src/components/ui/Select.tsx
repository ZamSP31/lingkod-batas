import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "../attorney/icons.js";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  helperText?: string | undefined;
  error?: string | undefined;
}

/**
 * A styled dropdown (button + listbox) rather than a native <select>,
 * so it can match the app's visual language (rounded panel, hover
 * highlight) the way native OS-rendered <select> options can't.
 * Closes on outside click, Escape, or selecting an option.
 */
function Select({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  helperText,
  error,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-ink-900">
        {label}
      </label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700/40 ${
          error ? "border-maroon-600" : "border-hairline"
        } ${isOpen ? "ring-2 ring-navy-700/40" : ""}`}
      >
        <span className={selected ? "text-ink-900" : "text-ink-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-hairline bg-white py-1 shadow-lg shadow-navy-950/10"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`block w-full px-3.5 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-navy-900/5 font-medium text-navy-900"
                      : "text-ink-900 hover:bg-parchment-100"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="mt-1.5 text-xs text-maroon-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-ink-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Select;
