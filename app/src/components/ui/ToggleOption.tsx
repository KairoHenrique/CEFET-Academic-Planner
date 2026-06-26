import { Icon } from "@/components/ui/Icon";

interface ToggleOptionProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleOption({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleOptionProps) {
  return (
    <button
      type="button"
      className={`toggle-option ${checked ? "active" : ""}`}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-option-check" aria-hidden>
        {checked && <Icon name="check" size={11} />}
      </span>
      <span className="toggle-option-text">
        <span className="toggle-option-label">{label}</span>
        {description && (
          <span className="toggle-option-desc">{description}</span>
        )}
      </span>
    </button>
  );
}
