interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

/**
 * A labeled on/off switch, used for notification preferences (Fig.
 * 3.30-ish client Account page). Not part of the original ui/ set —
 * added because none of Checkbox/Select fit a "preference toggle"
 * shape. Follows the same label+description layout as Card's header.
 */
function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink-900">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-ink-400">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-navy-900" : "bg-hairline"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default Toggle;