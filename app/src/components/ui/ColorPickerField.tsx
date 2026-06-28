"use client";

import { useId } from "react";
import {
  CRUZEIRO_PALETTE,
  normalizeHexColor,
} from "@/lib/colors/palette";

interface ColorPickerFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function ColorPickerField({
  label,
  value,
  onChange,
  compact = false,
  disabled = false,
}: ColorPickerFieldProps) {
  const groupId = useId();
  const normalized = normalizeHexColor(value) ?? value;

  return (
    <fieldset
      className={`color-picker-field ${compact ? "color-picker-field-compact" : ""}`}
      disabled={disabled}
    >
      <legend className="form-label">{label}</legend>
      <div
        className="color-picker-swatches"
        role="radiogroup"
        aria-labelledby={groupId}
      >
        {CRUZEIRO_PALETTE.map((option) => {
          const selected = normalized === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.label}
              className={`color-picker-swatch ${selected ? "is-selected" : ""}`}
              style={{ background: option.value }}
              onClick={() => onChange(option.value)}
            />
          );
        })}
        <label className="color-picker-custom" title="Cor personalizada">
          <span className="color-picker-custom-preview" style={{ background: normalized }} />
          <input
            type="color"
            className="color-picker-native"
            value={normalizeHexColor(value) ?? "#D4A843"}
            onChange={(event) => {
              const next = normalizeHexColor(event.target.value);
              if (next) onChange(next);
            }}
          />
        </label>
      </div>
    </fieldset>
  );
}
