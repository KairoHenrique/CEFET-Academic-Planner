"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useDismissiblePopup } from "@/hooks/useDismissiblePopup";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  allowClear?: boolean;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatBr(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function monthFromIso(iso: string): { year: number; month: number } {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month] = iso.split("-").map(Number);
    return { year, month: month - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function buildDayCells(year: number, month: number): Array<number | null> {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DatePickerField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  allowClear = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(() => monthFromIso(value));

  useDismissiblePopup(open, () => setOpen(false), rootRef);

  const cells = useMemo(
    () => buildDayCells(view.year, view.month),
    [view.month, view.year]
  );
  const today = todayIso();
  const display = formatBr(value);

  function openCalendar() {
    if (disabled) return;
    setView(monthFromIso(value || today));
    setOpen((current) => !current);
  }

  function pickDay(day: number) {
    const iso = toIso(view.year, view.month, day);
    if (min && iso < min) return;
    onChange(iso);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  }

  return (
    <div
      ref={rootRef}
      className={`date-picker ${open ? "date-picker--open" : ""}`.trim()}
    >
      <span className="form-label">{label}</span>
      <button
        type="button"
        className="date-picker-trigger"
        onClick={openCalendar}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${display || "escolher no calendário"}`}
      >
        <span className={display ? undefined : "date-picker-placeholder"}>
          {display || "DD/MM/AAAA"}
        </span>
        <Icon name="calendar" size={16} />
      </button>

      {open ? (
        <div className="date-picker-cal" role="dialog" aria-label="Calendário">
          <div className="date-picker-cal-head">
            <button
              type="button"
              className="date-picker-nav"
              onClick={() => shiftMonth(-1)}
              aria-label="Mês anterior"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <span className="date-picker-cal-title">
              {MONTHS[view.month]} {view.year}
            </span>
            <button
              type="button"
              className="date-picker-nav"
              onClick={() => shiftMonth(1)}
              aria-label="Próximo mês"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          <div className="date-picker-weekdays">
            {WEEKDAYS.map((day, index) => (
              <span key={`${day}-${index}`} className="date-picker-weekday">
                {day}
              </span>
            ))}
          </div>

          <div className="date-picker-days">
            {cells.map((day, index) => {
              if (day == null) {
                return <span key={`e-${index}`} className="date-picker-day is-empty" />;
              }
              const iso = toIso(view.year, view.month, day);
              const blocked = Boolean(min && iso < min);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`date-picker-day ${iso === value ? "is-selected" : ""} ${iso === today ? "is-today" : ""}`.trim()}
                  disabled={blocked}
                  onClick={() => pickDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="date-picker-cal-foot">
            <button
              type="button"
              className="date-picker-foot-btn"
              onClick={() => {
                const iso = today;
                if (min && iso < min) return;
                onChange(iso);
                setView(monthFromIso(iso));
                setOpen(false);
              }}
            >
              Hoje
            </button>
            {allowClear && !required ? (
              <button
                type="button"
                className="date-picker-foot-btn"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
