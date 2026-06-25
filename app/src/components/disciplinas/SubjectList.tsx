"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { FilterBar } from "@/components/ui/FilterBar";
import { semesterSubjects } from "@/config/mock/subjects";

const filters = ["Todas", "Com tarefas", "Risco de faltas"];

export function SubjectList() {
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [search, setSearch] = useState("");

  const filtered = semesterSubjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(search.toLowerCase()) ||
      subject.code.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "Todas" ||
      (activeFilter === "Com tarefas" && subject.tasks > 0) ||
      (activeFilter === "Risco de faltas" &&
        subject.absences / subject.maxAbsences >= 0.5);

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="col-12 page-toolbar">
        <div className="search-input-wrap">
          <Icon name="search" size={16} />
          <input
            type="search"
            className="search-input"
            placeholder="Buscar disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar disciplina"
          />
        </div>
        <FilterBar
          filters={filters}
          active={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      <div className="col-12">
        <div className="data-table-wrap card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Professor</th>
                <th>Horário</th>
                <th>Nota</th>
                <th>Faltas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((subject) => (
                <tr key={subject.code}>
                  <td>
                    <div className="table-subject">
                      <span
                        className="subject-dot"
                        style={{ background: subject.color }}
                      />
                      <div>
                        <p className="table-subject-name">{subject.name}</p>
                        <p className="table-subject-code">{subject.code}</p>
                      </div>
                    </div>
                  </td>
                  <td>{subject.professor}</td>
                  <td>{subject.schedule}</td>
                  <td>
                    {subject.grade !== null
                      ? `${subject.grade} / ${subject.gradeMax}`
                      : "—"}
                  </td>
                  <td>
                    {subject.absences} / {subject.maxAbsences}
                  </td>
                  <td>
                    <Link
                      href={`/disciplinas/${subject.code}`}
                      className="table-action-link"
                    >
                      Detalhes
                      <Icon name="arrow-right" size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
