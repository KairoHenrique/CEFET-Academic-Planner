import { Fragment } from "react";
import type { AcademicDateSemesterGroup } from "@/lib/types/calendar-api";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface CalendarAcademicDatesProps {
  groups: AcademicDateSemesterGroup[];
  isLoading?: boolean;
}

const EMPTY_SEMESTER_MESSAGE = "Nenhuma informação";

export function CalendarAcademicDates({
  groups,
  isLoading = false,
}: CalendarAcademicDatesProps) {
  return (
    <div className="card academic-dates-card">
      <SectionHeader title="Calendário Acadêmico" icon="clipboard" />
      {isLoading ? (
        <ul className="academic-dates-list" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="academic-date-item">
              <span className="skeleton academic-date-skeleton" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="academic-dates-groups">
          {groups.map((group, index) => (
            <Fragment key={group.semestre}>
              {index > 0 && (
                <div className="academic-dates-divider" aria-hidden="true" />
              )}
              <section
                className="academic-dates-semester-block"
                aria-label={`Calendário ${group.semestre}`}
              >
                <h3 className="academic-dates-semester-title">
                  Semestre{" "}
                  <span className="academic-dates-semester-code">{group.semestre}</span>
                </h3>
                {group.items.length === 0 ? (
                  <p className="academic-dates-empty">{EMPTY_SEMESTER_MESSAGE}</p>
                ) : (
                  <ul className="academic-dates-list">
                    {group.items.map((item) => (
                      <li
                        key={`${group.semestre}-${item.label}-${item.date}`}
                        className="academic-date-item"
                      >
                        <span className="academic-date-label">{item.label}</span>
                        <span className="academic-date-value">{item.date}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
