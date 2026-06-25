export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "aula" | "tarefa" | "prova" | "evento";
  subject?: string;
  subjectCode?: string;
  color: string;
  description: string;
}

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
  { label: "Início das aulas", date: "10/02/2026" },
  { label: "Trancamento de matéria", date: "28/03/2026" },
  { label: "Recesso", date: "25/06 – 12/07/2026" },
  { label: "Provas finais", date: "14/07 – 25/07/2026" },
];

export const eventTypeLabels = {
  aula: "Aula",
  tarefa: "Tarefa",
  prova: "Prova",
  evento: "Evento",
} as const;

export type EventTypeFilter = "todas" | CalendarEvent["type"];

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatEventDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
