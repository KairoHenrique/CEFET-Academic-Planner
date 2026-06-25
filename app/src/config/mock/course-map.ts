export type CourseStatus = "done" | "current" | "unlocked" | "locked";

export interface CourseNode {
  code: string;
  name: string;
  ch: number;
  status: CourseStatus;
}

export interface CoursePeriod {
  period: number;
  subjects: CourseNode[];
}

export const courseMap: CoursePeriod[] = [
  {
    period: 1,
    subjects: [
      { code: "CALC1", name: "Cálculo I", ch: 60, status: "done" },
      { code: "ALG1", name: "Álgebra Linear", ch: 60, status: "done" },
      { code: "PROG1", name: "Programação I", ch: 60, status: "done" },
    ],
  },
  {
    period: 2,
    subjects: [
      { code: "CALC2", name: "Cálculo II", ch: 60, status: "done" },
      { code: "FIS1", name: "Física I", ch: 60, status: "done" },
      { code: "PROG2", name: "Programação II", ch: 60, status: "done" },
    ],
  },
  {
    period: 3,
    subjects: [
      { code: "AEDI", name: "Alg. e Estr. Dados I", ch: 60, status: "current" },
      { code: "AOCI", name: "Arq. e Org. Comp. I", ch: 60, status: "current" },
      { code: "DISC", name: "Discreta", ch: 60, status: "done" },
    ],
  },
  {
    period: 4,
    subjects: [
      { code: "ENG-SOFT", name: "Eng. de Software", ch: 60, status: "current" },
      { code: "SO", name: "Sistemas Operacionais", ch: 60, status: "unlocked" },
      { code: "BD1", name: "Banco de Dados I", ch: 60, status: "locked" },
    ],
  },
  {
    period: 5,
    subjects: [
      { code: "REDES", name: "Redes de Computadores", ch: 60, status: "locked" },
      { code: "IA", name: "Inteligência Artificial", ch: 60, status: "locked" },
    ],
  },
];

export const courseStatusLabels: Record<CourseStatus, string> = {
  done: "Concluída",
  current: "Cursando",
  unlocked: "Desbloqueada",
  locked: "Trancada",
};
