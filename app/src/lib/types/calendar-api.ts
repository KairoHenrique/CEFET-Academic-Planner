import type { CalendarEvent } from "./calendar";

export interface AcademicDateItem {
  label: string;
  date: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  academicDates: AcademicDateItem[];
}

export interface CreateCalendarEventBody {
  title: string;
  description?: string;
  type: CalendarEvent["type"];
  date: string;
  subjectCode?: string;
  color?: string;
}
