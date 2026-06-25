"use client";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubjectCard, type Subject } from "./SubjectCard";

const subjects: Subject[] = [
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
  },
  {
    name: "Engenharia de Software",
    code: "Eng. Soft.",
    room: "301/303",
    grade: 24.8,
    gradeMax: 100,
    absences: 8,
    maxAbsences: 15,
    tasks: 2,
    color: "#F47067",
  },
  {
    name: "Empreendedorismo e Plano de Negócios",
    code: "Empreend.",
    room: "301",
    grade: null,
    gradeMax: 100,
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#3FB950",
  },
  {
    name: "Introdução à Sociologia",
    code: "Sociologia",
    room: "306",
    grade: null,
    gradeMax: 100,
    absences: 0,
    maxAbsences: 7,
    tasks: 0,
    color: "#A371F7",
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
  },
];

export function SubjectsGrid() {
  return (
    <section>
      <SectionHeader
        title="Disciplinas do Semestre"
        icon="books"
        href="/disciplinas"
        linkLabel="Ver todas"
      />

      <div className="subjects-grid stagger-children">
        {subjects.map((subject) => (
          <SubjectCard key={subject.code} subject={subject} />
        ))}
      </div>
    </section>
  );
}
