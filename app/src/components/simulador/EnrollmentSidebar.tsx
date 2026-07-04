"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { EnrollmentCourseList } from "@/components/simulador/EnrollmentCourseList";
import { filterEnrollmentCoursesByQuery } from "@/lib/simulador/filter-enrollment-courses";
import type { CorequisitoObligation } from "@/lib/simulador/corequisito-cluster-viability";
import type { SimuladorPlacementContext } from "@/lib/simulador/corequisito-schedule-policy";
import type { ScheduleSlot } from "@/lib/types/schedule";
import type { EnrollmentCourseGroup } from "@/lib/simulador/group-enrollment-courses";
import type { TurmaOfertadaCourse } from "@/lib/types/turmas-ofertadas-api";

interface EnrollmentSidebarProps {
  curso: TurmaOfertadaCourse[];
  optativas: TurmaOfertadaCourse[];
  catalog: TurmaOfertadaCourse[];
  schedule: ScheduleSlot[][];
  placementContext: SimuladorPlacementContext;
  corequisitoObligation: CorequisitoObligation | null;
  selectedTurmaId: string | null;
  selectedGroupId?: string | null;
  onSelect: (course: TurmaOfertadaCourse) => void;
  onSelectGroup?: (group: EnrollmentCourseGroup) => void;
}

export function EnrollmentSidebar({
  curso,
  optativas,
  catalog,
  schedule,
  placementContext,
  corequisitoObligation,
  selectedTurmaId,
  selectedGroupId = null,
  onSelect,
  onSelectGroup,
}: EnrollmentSidebarProps) {
  const [query, setQuery] = useState("");

  const filteredCurso = useMemo(
    () => filterEnrollmentCoursesByQuery(curso, query),
    [curso, query]
  );
  const filteredOptativas = useMemo(
    () => filterEnrollmentCoursesByQuery(optativas, query),
    [optativas, query]
  );

  const totalAvailable = curso.length + optativas.length;
  const totalFiltered = filteredCurso.length + filteredOptativas.length;
  const isEmpty = totalAvailable === 0;
  const noSearchResults = !isEmpty && totalFiltered === 0;

  return (
    <div className="enrollment-catalog" data-tutorial-id="tutorial-enrollment-sidebar">
      <div className="enrollment-sidebar-toolbar">
        <label className="enrollment-search" htmlFor="enrollment-course-search">
          <Icon name="search" size={14} className="enrollment-search-icon" aria-hidden />
          <input
            id="enrollment-course-search"
            type="search"
            className="enrollment-search-input"
            placeholder="Buscar disciplina ou sigla…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <span className="enrollment-sidebar-meta">
          {totalAvailable} {totalAvailable === 1 ? "disponível" : "disponíveis"}
        </span>
      </div>

      {isEmpty ? (
        <div className="enrollment-sidebar-empty" role="status">
          <Icon name="check" size={20} className="enrollment-sidebar-empty-icon" aria-hidden />
          <p className="enrollment-sidebar-empty-title">Grade completa</p>
          <p className="enrollment-sidebar-empty-text">
            Todas as turmas elegíveis já estão na grade. Clique em uma célula ocupada para
            remover ou limpe a grade para recomeçar.
          </p>
        </div>
      ) : noSearchResults ? (
        <div className="enrollment-sidebar-empty" role="status">
          <Icon name="search" size={20} className="enrollment-sidebar-empty-icon" aria-hidden />
          <p className="enrollment-sidebar-empty-title">Nenhum resultado</p>
          <p className="enrollment-sidebar-empty-text">
            Nenhuma turma corresponde a &quot;{query.trim()}&quot;.
          </p>
        </div>
      ) : (
        <div className="enrollment-sidebar-row">
          <aside className="enrollment-sidebar" aria-label="Disciplinas obrigatórias">
            <EnrollmentCourseList
              title="Obrigatórias"
              courses={filteredCurso}
              catalog={catalog}
              schedule={schedule}
              placementContext={placementContext}
              corequisitoObligation={corequisitoObligation}
              selectedTurmaId={selectedTurmaId}
              selectedGroupId={selectedGroupId}
              onSelect={onSelect}
              onSelectGroup={onSelectGroup}
            />
          </aside>

          <aside className="enrollment-sidebar" aria-label="Optativas e tópicos">
            <EnrollmentCourseList
              title="Optativas"
              courses={filteredOptativas}
              catalog={catalog}
              schedule={schedule}
              placementContext={placementContext}
              corequisitoObligation={corequisitoObligation}
              selectedTurmaId={selectedTurmaId}
              selectedGroupId={selectedGroupId}
              onSelect={onSelect}
              onSelectGroup={onSelectGroup}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
