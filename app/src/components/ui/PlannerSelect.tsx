"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDismissiblePopup } from "@/hooks/useDismissiblePopup";

export interface PlannerSelectOption<T extends string> {
  value: T;
  label: string;
  title?: string;
}

interface PlannerSelectProps<T extends string> {
  id?: string;
  label: string;
  value: T;
  options: PlannerSelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  hideLabel?: boolean;
  fullWidth?: boolean;
  menuAlign?: "start" | "end";
  onPointerDown?: (event: React.PointerEvent) => void;
  onMouseDown?: (event: React.MouseEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
}

function isolateInteraction(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function PlannerSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
  hideLabel = false,
  fullWidth = false,
  menuAlign = "start",
  onPointerDown,
  onMouseDown,
  onClick,
}: PlannerSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectId = id ?? `planner-select-${label.replace(/\s+/g, "-").toLowerCase()}`;

  useDismissiblePopup(open, () => setOpen(false), rootRef);

  const selected = options.find((option) => option.value === value);

  const pickValue = (next: T) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div
      className={`planner-select-wrap ${fullWidth ? "planner-select-wrap--full" : ""} ${className}`.trim()}
      onPointerDown={onPointerDown}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <label
        className={`planner-select-label ${hideLabel ? "sr-only" : ""}`}
        htmlFor={selectId}
      >
        {label}
      </label>

      <div
        ref={rootRef}
        className={`planner-select ${fullWidth ? "planner-select--full" : ""} ${menuAlign === "end" ? "planner-select--align-end" : ""} ${open ? "planner-select--open" : ""}`.trim()}
        onClick={isolateInteraction}
        onMouseDown={isolateInteraction}
        onPointerDown={isolateInteraction}
      >
        <button
          id={selectId}
          type="button"
          className="planner-select-trigger"
          aria-label={hideLabel ? label : undefined}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="planner-select-trigger-label">
            {selected?.label ?? "Selecionar"}
          </span>
          <Icon
            name="chevron-down"
            size={14}
            className={`planner-select-chevron ${open ? "planner-select-chevron--open" : ""}`}
          />
        </button>

        {open && (
          <ul
            id={listboxId}
            className={`planner-select-menu ${fullWidth ? "planner-select-menu--full planner-select-menu--panel" : ""}`.trim()}
            role="listbox"
            aria-label={label}
            onWheel={isolateInteraction}
            onTouchMove={isolateInteraction}
            onScroll={isolateInteraction}
          >
            {options.map((option) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  title={option.title ?? option.label}
                  className={`planner-select-menu-option ${option.value === value ? "is-active" : ""}`.trim()}
                  onClick={() => pickValue(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
