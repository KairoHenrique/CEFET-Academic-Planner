export interface Subject {
  name: string;
  code: string;
  room: string;
  grade: number | null;
  gradeMax: number;
  absences: number;
  maxAbsences: number;
  tasks: number;
  color: string;
  professor?: string;
  schedule?: string;
  ch?: number;
}

export const semesterSubjects: Subject[] = [
  {
    name: "Algoritmos e Estruturas de Dados I",
    code: "AEDI",
    room: "303/620",
    grade: null,
    gradeMax: 100,
    absences: 4,
    maxAbsences: 15,
    tasks: 1,
    color: "#3AA0E8",
    professor: "Prof. João Silva",
    schedule: "Qua 7:00 · Sex 10:50",
    ch: 60,
  },
  {
    name: "Arq. e Org. de Computadores I",
    code: "AOCI",
    room: "314",
    grade: null,
    gradeMax: 100,
    absences: 2,
    maxAbsences: 15,
    tasks: 0,
    color: "#D4A843",
    professor: "Prof. Maria Costa",
    schedule: "Ter 8:55",
    ch: 60,
  },
  {
    name: "Engenharia de Software",
    code: "ENG-SOFT",
    room: "301/303",
    grade: 24.8,
    gradeMax: 100,
    absences: 8,
    maxAbsences: 15,
    tasks: 2,
    color: "#F47067",
    professor: "Prof. Ana Lima",
    schedule: "Qua 7:00 · Qui 10:50",
    ch: 60,
  },
  {
    name: "Empreendedorismo e Plano de Negócios",
    code: "EMPREEND",
    room: "301",
    grade: null,
    gradeMax: 100,
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#3FB950",
    professor: "Prof. Carlos Mendes",
    schedule: "Ter 19:00",
    ch: 30,
  },
  {
    name: "Introdução à Sociologia",
    code: "SOCIOLOGIA",
    room: "306",
    grade: null,
    gradeMax: 100,
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#A371F7",
    professor: "Prof. Rita Alves",
    schedule: "Ter 20:55",
    ch: 30,
  },
  {
    name: "Lab. Alg. e Estruturas de Dados I",
    code: "LAEDI",
    room: "604",
    grade: null,
    gradeMax: 100,
    absences: 2,
    maxAbsences: 11,
    tasks: 0,
    color: "#79C0FF",
    professor: "Prof. João Silva",
    schedule: "Qua 8:55",
    ch: 30,
  },
  {
    name: "Lab. Arq. e Org. de Comp. I",
    code: "LAOCI",
    room: "304",
    grade: 9.0,
    gradeMax: 25,
    absences: 4,
    maxAbsences: 7,
    tasks: 2,
    color: "#E3B341",
    professor: "Prof. Maria Costa",
    schedule: "Qui 8:55",
    ch: 30,
  },
];

export function getSubjectByCode(code: string): Subject | undefined {
  return semesterSubjects.find(
    (s) => s.code.toLowerCase() === code.toLowerCase()
  );
}
