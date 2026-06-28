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

export type PatchCalendarEventBody =
  | { action: "toggle"; done: boolean }
  | {
      action: "update";
      title?: string;
      description?: string;
      date?: string;
      type?: CalendarEvent["type"];
      subjectCode?: string | null;
      color?: string;
      done?: boolean;
    }
  | { action: "delete" };

export interface PatchCalendarEventResponse {
  id: string;
  done?: boolean;
  updated?: boolean;
  deleted?: boolean;
}
