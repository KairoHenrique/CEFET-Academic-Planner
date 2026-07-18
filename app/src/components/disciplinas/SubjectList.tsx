"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { FilterBar } from "@/components/ui/FilterBar";
import { PrioritySelect } from "@/components/ui/PrioritySelect";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { SubjectGradeCell } from "@/components/grades/SubjectGradeCell";
import { SubjectListSkeleton } from "@/components/disciplinas/SubjectListSkeleton";
import { SubjectScheduleCell } from "@/components/disciplinas/SubjectScheduleCell";
import { SubjectRoomCell } from "@/components/disciplinas/SubjectRoomCell";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import { useSubjectPriorities } from "@/hooks/useStoredPriorities";
import { sortSubjectsByPriority } from "@/lib/priority/sort";
import { computeAbsenceRisk } from "@/lib/disciplinas/absence-risk";

import { disciplinaDetailPath } from "@/lib/disciplinas/disciplina-path";
import { DISCIPLINA_FILTER_LABELS } from "@/lib/disciplinas/list-filters";

export function SubjectList() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const { items, isLoading, isFetching, error, refetch } = useDisciplinas(
    search,
    activeFilter
  );
  const { getPriority, setSubjectPriority, map } = useSubjectPriorities();

  const sortedItems = useMemo(() => {
    return sortSubjectsByPriority(items, getPriority);
  }, [items, getPriority, map]);

  const openSubject = (code: string) => {
    router.push(disciplinaDetailPath(code));
  };

  return (
    <div className="subject-list" data-tutorial-id="tutorial-discipline-list">
      <div className="page-toolbar subject-list-toolbar">
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
          filters={[...DISCIPLINA_FILTER_LABELS]}
          active={activeFilter}
          onChange={setActiveFilter}
          className="subject-list-filters"
          nowrap
        />
      </div>

      {isLoading ? (
        <SubjectListSkeleton />
      ) : error ? (
        <DashboardStateCard
          variant="error"
          title="Erro ao carregar disciplinas"
          message={error}
          actionLabel="Tentar novamente"
          onRetry={() => void refetch()}
        />
      ) : sortedItems.length === 0 ? (
        <DashboardStateCard
          title="Nenhuma disciplina encontrada"
          message={
            search || activeFilter !== "Todas"
              ? "Ajuste a busca ou o filtro para ver outras matérias."
              : "Sincronize com o SIGAA para importar as disciplinas do semestre."
          }
          actionLabel={search || activeFilter !== "Todas" ? undefined : "Ir para login"}
          actionHref={search || activeFilter !== "Todas" ? undefined : "/login"}
        />
      ) : (
        <>
          <div
            className={`subject-list-cards ${isFetching ? "data-table-fetching" : ""}`}
          >
            {sortedItems.map((subject, index) => {
              const absenceRisk = computeAbsenceRisk(
                subject.absences,
                subject.maxAbsences
              );
              return (
                <article
                  key={`card-${subject.code}`}
                  className="subject-list-card"
                  data-tutorial-id={
                    index === 0 ? "tutorial-discipline-row" : undefined
                  }
                  data-discipline-code={index === 0 ? subject.code : undefined}
                  onClick={() => openSubject(subject.code)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openSubject(subject.code);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`Abrir detalhes de ${subject.name}`}
                >
                  <div className="subject-list-card-top">
                    <div className="table-subject">
                      <span
                        className="subject-dot"
                        style={{ background: subject.color }}
                      />
                      <div>
                        <p className="table-subject-name">{subject.name}</p>
                        <p className="table-subject-code">{subject.shortLabel}</p>
                      </div>
                    </div>
                    <div onClick={(event) => event.stopPropagation()}>
                      <PrioritySelect
                        level={getPriority(subject.code)}
                        compact
                        onChange={(level) =>
                          setSubjectPriority(subject.code, level)
                        }
                      />
                    </div>
                  </div>
                  <div className="subject-list-card-meta">
                    <div>
                      <strong>Horário</strong>
                      <SubjectScheduleCell schedule={subject.schedule} />
                    </div>
                    <div>
                      <strong>Sala</strong>
                      <SubjectRoomCell room={subject.room} />
                    </div>
                  </div>
                  <div
                    className="subject-list-card-foot"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <SubjectGradeCell subject={subject} />
                    <span className={`badge ${absenceRisk.badgeClass}`}>
                      {subject.absences}/{subject.maxAbsences} faltas
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <div
            className={`data-table-wrap card subject-list-table ${isFetching ? "data-table-fetching" : ""}`}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-priority" aria-label="Prioridade" />
                  <th className="col-subject">Disciplina</th>
                  <th className="col-professor">Professor</th>
                  <th className="col-schedule">Horário</th>
                  <th className="col-room">Sala</th>
                  <th className="col-grade-risk">Nota</th>
                  <th className="col-absences">Faltas</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((subject, index) => {
                  const absenceRisk = computeAbsenceRisk(
                    subject.absences,
                    subject.maxAbsences
                  );
                  return (
                    <tr
                      key={subject.code}
                      className="data-table-row-clickable subject-table-row"
                      data-tutorial-id={
                        index === 0 ? "tutorial-discipline-row" : undefined
                      }
                      data-discipline-code={
                        index === 0 ? subject.code : undefined
                      }
                      onClick={() => openSubject(subject.code)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openSubject(subject.code);
                        }
                      }}
                      aria-label={`Abrir detalhes de ${subject.name}`}
                    >
                      <td className="col-priority">
                        <PrioritySelect
                          level={getPriority(subject.code)}
                          compact
                          onChange={(level) =>
                            setSubjectPriority(subject.code, level)
                          }
                        />
                      </td>
                      <td className="col-subject">
                        <div className="table-subject">
                          <span
                            className="subject-dot"
                            style={{ background: subject.color }}
                          />
                          <div>
                            <p className="table-subject-name">{subject.name}</p>
                            <p className="table-subject-code">
                              {subject.shortLabel}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="col-professor">
                        {subject.professor ?? "—"}
                      </td>
                      <td className="col-schedule">
                        <SubjectScheduleCell schedule={subject.schedule} />
                      </td>
                      <td className="col-room">
                        <SubjectRoomCell room={subject.room} />
                      </td>
                      <td
                        className="col-grade-risk"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <SubjectGradeCell subject={subject} />
                      </td>
                      <td className="col-absences">
                        <span className={`badge ${absenceRisk.badgeClass}`}>
                          {subject.absences}/{subject.maxAbsences}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
