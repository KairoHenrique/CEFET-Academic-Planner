import type { AcademicDateItem } from "@/lib/types/calendar-api";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface CalendarAcademicDatesProps {
  items: AcademicDateItem[];
  isLoading?: boolean;
}

export function CalendarAcademicDates({
  items,
  isLoading = false,
}: CalendarAcademicDatesProps) {
  return (
    <div className="card">
      <SectionHeader title="Calendário Acadêmico" icon="clipboard" />
      {isLoading ? (
        <ul className="academic-dates-list" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="academic-date-item">
              <span className="skeleton academic-date-skeleton" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="calendar-empty-state">Nenhuma data acadêmica cadastrada.</p>
      ) : (
        <ul className="academic-dates-list">
          {items.map((item) => (
            <li key={`${item.label}-${item.date}`} className="academic-date-item">
              <span className="academic-date-label">{item.label}</span>
              <span className="academic-date-value">{item.date}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
