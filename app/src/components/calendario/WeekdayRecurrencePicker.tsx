"use client";

import {
  toggleRecurrenceDay,
  WEEKDAY_PICKER_OPTIONS,
  type WeekdayIndex,
} from "@/lib/calendar/recurrence-weekdays";

interface WeekdayRecurrencePickerProps {
  selectedDays: WeekdayIndex[];
  disabled?: boolean;
  onChange: (days: WeekdayIndex[]) => void;
}

export function WeekdayRecurrencePicker({
  selectedDays,
  disabled = false,
  onChange,
}: WeekdayRecurrencePickerProps) {
  return (
    <fieldset className="weekday-recurrence" disabled={disabled}>
      <legend className="form-label">Dias da semana</legend>
      <div className="weekday-recurrence-row" role="group" aria-label="Dias da semana">
        {WEEKDAY_PICKER_OPTIONS.map((option) => {
          const isActive = selectedDays.includes(option.index);

          return (
            <button
              key={option.index}
              type="button"
              className={`weekday-recurrence-day${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              aria-label={option.label}
              disabled={disabled}
              onClick={() =>
                onChange(toggleRecurrenceDay(selectedDays, option.index))
              }
            >
              <span className="weekday-recurrence-letter">{option.short}</span>
            </button>
          );
        })}
      </div>
      <p className="add-event-field-hint">Opcional</p>
    </fieldset>
  );
}
