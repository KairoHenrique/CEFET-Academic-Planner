import { academicDates } from "@/config/mock/calendar";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CalendarAcademicDates() {
  return (
    <div className="card">
      <SectionHeader title="Calendário Acadêmico" icon="clipboard" />
      <ul className="academic-dates-list">
        {academicDates.map((item) => (
          <li key={item.label} className="academic-date-item">
            <span className="academic-date-label">{item.label}</span>
            <span className="academic-date-value">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
