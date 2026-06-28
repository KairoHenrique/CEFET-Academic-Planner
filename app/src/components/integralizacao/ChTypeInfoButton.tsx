"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChType } from "@/lib/integralizacao/ch-catalog";
import { getChGlossaryEntry } from "@/lib/integralizacao/ch-glossary";
import { Icon } from "@/components/ui/Icon";

interface ChTypeInfoButtonProps {
  tipoCh: ChType;
  compact?: boolean;
}

export function ChTypeInfoButton({
  tipoCh,
  compact = false,
}: ChTypeInfoButtonProps) {
  const entry = getChGlossaryEntry(tipoCh);
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!entry) return null;

  return (
    <div className="ch-type-info" ref={rootRef}>
      <button
        type="button"
        className="ch-type-info-trigger"
        aria-label={`O que é ${entry.title}`}
        aria-expanded={open}
        aria-controls={popoverId}
        title={compact ? entry.summary : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="help-circle" size={compact ? 14 : 16} />
      </button>
      {open ? (
        <div
          id={popoverId}
          className="ch-type-info-popover"
          role="tooltip"
        >
          <p className="ch-type-info-summary">{entry.summary}</p>
          {!compact ? (
            <p className="ch-type-info-description">{entry.description}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
