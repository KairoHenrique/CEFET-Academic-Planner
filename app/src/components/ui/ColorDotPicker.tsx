"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ColorPickerField } from "@/components/ui/ColorPickerField";
import { normalizeHexColor } from "@/lib/colors/palette";

interface ColorDotPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  modalTitle?: string;
  pickerLabel?: string;
  className?: string;
  size?: "sm" | "md";
}

export function ColorDotPicker({
  value,
  onChange,
  disabled = false,
  ariaLabel = "Escolher cor",
  modalTitle = "Escolher cor",
  pickerLabel = "Paleta de cores",
  className = "",
  size = "md",
}: ColorDotPickerProps) {
  const [open, setOpen] = useState(false);
  const normalized = normalizeHexColor(value) ?? value;

  const handleChange = (color: string) => {
    onChange(color);
  };

  return (
    <>
      <button
        type="button"
        className={`color-dot-picker color-dot-picker--${size} ${className}`.trim()}
        aria-label={ariaLabel}
        title={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <span
          className="color-dot-picker__dot"
          style={{ backgroundColor: normalized }}
          aria-hidden
        />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle}>
        <ColorPickerField
          label={pickerLabel}
          value={value}
          onChange={handleChange}
          disabled={disabled}
        />
        <div className="color-dot-picker__actions">
          <button
            type="button"
            className="btn-gold"
            onClick={() => setOpen(false)}
          >
            Pronto
          </button>
        </div>
      </Modal>
    </>
  );
}
