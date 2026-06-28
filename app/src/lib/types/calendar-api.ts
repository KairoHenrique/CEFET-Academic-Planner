import type { CalendarEvent } from "./calendar";

export interface AcademicDateItem {
  label: string;
  date: string;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  academicDates: AcademicDateItem[];
}
