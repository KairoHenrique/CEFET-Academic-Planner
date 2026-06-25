import type { ScheduleSlotData } from "@/config/mock/schedule";

export interface OfferedCourse {
  code: string;
  name: string;
  status: "unlocked" | "locked";
  color: string;
  room: string;
  professor: string;
  ch: number;
  slots: { day: number; slot: number }[];
}

export const offeredCourses: OfferedCourse[] = [
  {
    code: "SO",
    name: "Sistemas Operacionais",
    status: "unlocked",
    color: "#3FB950",
    room: "201",
    professor: "Prof. Ricardo Almeida",
    ch: 60,
    slots: [{ day: 2, slot: 3 }],
  },
  {
    code: "BD1",
    name: "Banco de Dados I",
    status: "locked",
    color: "#79C0FF",
    room: "305",
    professor: "Prof. Fernanda Dias",
    ch: 60,
    slots: [{ day: 1, slot: 1 }],
  },
  {
    code: "REDES",
    name: "Redes de Computadores",
    status: "locked",
    color: "#A371F7",
    room: "402",
    professor: "Prof. Paulo Nunes",
    ch: 60,
    slots: [{ day: 3, slot: 4 }],
  },
];

export function courseToSlotData(course: OfferedCourse): ScheduleSlotData {
  return {
    code: course.code,
    name: course.code,
    room: course.room,
    color: course.color,
    professor: course.professor,
    ch: course.ch,
  };
}
