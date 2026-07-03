import type { CalendarEvent } from "./calendar";

export interface AcademicDateItem {
  label: string;
  date: string;
}

export interface AcademicDateSemesterGroup {
  semestre: string;
  items: AcademicDateItem[];
}

export interface CalendarResponse {
  events: CalendarEvent[];
  /** @deprecated Prefer academicDateGroups */
  academicDates: AcademicDateItem[];
  academicDateGroups: AcademicDateSemesterGroup[];
}

export interface CreateCalendarEventBody {
  title: string;
  description?: string;
  type: CalendarEvent["type"];
  date: string;
  dateEnd?: string;
  timeStart?: string;
  timeEnd?: string;
  recurrence?: "none" | "daily" | "weekly";
  recurrenceUntil?: string;
  recurrenceDays?: number[];
  subjectCode?: string;
  color?: string;
}

export type ManualCalendarEventInput = Omit<CalendarEvent, "id" | "manual"> & {
  colorOverride?: boolean;
  recurrence?: "none" | "daily" | "weekly";
  recurrenceUntil?: string;
  recurrenceDays?: number[];
};

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
