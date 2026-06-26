"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDismissiblePopup } from "@/hooks/useDismissiblePopup";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  type PriorityLevel,
} from "@/lib/types/priority";

type PriorityIconName =
  | "priority-high"
  | "priority-medium-high"
  | "priority-neutral"
  | "priority-medium-low"
  | "priority-low";

const ICON_BY_LEVEL: Record<PriorityLevel, PriorityIconName> = {
  high: "priority-high",
  medium_high: "priority-medium-high",
  neutral: "priority-neutral",
  low: "priority-low",
  medium_low: "priority-medium-low",
};

interface PrioritySelectProps {
  level: PriorityLevel;
  onChange: (level: PriorityLevel) => void;
  className?: string;
  compact?: boolean;
}

function isolateInteraction(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function PrioritySelect({
  level,
  onChange,
  className = "",
  compact = false,
}: PrioritySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useDismissiblePopup(open, () => setOpen(false), rootRef);

  const pickLevel = (next: PriorityLevel) => {
    onChange(next);
    setOpen(false);
  };

  const iconSize = compact ? 14 : 16;

  return (
    <div
      ref={rootRef}
      className={`priority-select priority-select--${level} ${compact ? "priority-select--compact" : ""} ${open ? "priority-select--open" : ""} ${className}`.trim()}
      onClick={isolateInteraction}
      onMouseDown={isolateInteraction}
      onPointerDown={isolateInteraction}
    >
      <button
        type="button"
        className="priority-select-trigger"
        aria-label={`Prioridade: ${PRIORITY_LABELS[level]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name={ICON_BY_LEVEL[level]} size={iconSize} />
      </button>

      {open && (
        <ul
          id={listboxId}
          className="priority-select-menu"
          role="listbox"
          aria-label="Prioridade"
        >
          {PRIORITY_ORDER.map((optionLevel) => (
            <li key={optionLevel} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={optionLevel === level}
                title={PRIORITY_LABELS[optionLevel]}
                className={`priority-select-menu-option priority-select-menu-option--${optionLevel} ${optionLevel === level ? "is-active" : ""}`.trim()}
                onClick={() => pickLevel(optionLevel)}
              >
                <Icon name={ICON_BY_LEVEL[optionLevel]} size={iconSize} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
