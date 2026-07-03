export type { CalendarEvent, EventTypeFilter } from "@/lib/types/calendar";
export {
  eventTypeLabels,
  parseLocalDate,
  formatEventDate,
} from "@/lib/types/calendar";
import type { CalendarEvent } from "@/lib/types/calendar";

export const calendarEvents: CalendarEvent[] = [
  {
    id: "1",
    date: "2026-04-26",
    title: "Seminário Metodologia Ágil",
    type: "tarefa",
    subject: "Eng. Software",
    subjectCode: "ENG-SOFT",
    color: "#F47067",
    description: "Apresentação em grupo sobre metodologias ágeis (Scrum e Kanban).",
  },
  {
    id: "2",
    date: "2026-05-20",
    title: "Diagramas UML",
    type: "tarefa",
    subject: "Eng. Software",
    subjectCode: "ENG-SOFT",
    color: "#F47067",
    description: "Entrega individual dos diagramas de casos de uso e classes.",
  },
  {
    id: "3",
    date: "2026-06-16",
    title: "Projeto Final",
    type: "tarefa",
    subject: "Eng. Software",
    subjectCode: "ENG-SOFT",
    color: "#F47067",
    description: "Entrega do projeto final da disciplina com documentação completa.",
  },
  {
    id: "4",
    date: "2026-06-18",
    title: "1ª Avaliação",
    type: "prova",
    subject: "LAOCI",
    subjectCode: "LAOCI",
    color: "#E3B341",
    description: "Prova sobre Unidade Lógica e Aritmética — vale 25 pontos.",
  },
  {
    id: "5",
    date: "2026-06-25",
    title: "Início do recesso",
    type: "evento",
    color: "#D4A843",
    description: "Início do recesso do calendário acadêmico 2026.1.",
  },
  {
    id: "6",
    date: "2026-07-06",
    title: "MIC1 — ULA",
    type: "tarefa",
    subject: "LAOCI",
    subjectCode: "LAOCI",
    color: "#E3B341",
    description: "MIC sobre implementação da Unidade Lógica e Aritmética.",
  },
];

export const academicDates = [
  { label: "Período Letivo 2026.1", date: "02/03/26 – 06/07/26" },
  { label: "Matrícula OnLine", date: "22/01/26 – 25/01/26" },
  { label: "Matrícula Extraordinária", date: "05/03/26 – 06/03/26" },
  { label: "Rematrícula", date: "29/01/26 – 01/02/26" },
  { label: "Ajustes das Rematrículas/Turmas", date: "09/03/26 – 10/03/26" },
  { label: "Recesso", date: "25/06/26 – 12/07/26" },
  { label: "Provas finais", date: "14/07/26 – 25/07/26" },
];

