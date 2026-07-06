"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { FilterBar } from "@/components/ui/FilterBar";
import { EnrollmentCourseList } from "@/components/simulador/EnrollmentCourseList";
import {
  ENROLLMENT_ELIGIBILITY_FILTER_LABELS,
  ENROLLMENT_ELIGIBILITY_FILTER_ORDER,
  filterEnrollmentCoursesByEligibility,
  filterEnrollmentCoursesByQuery,
  type EnrollmentEligibilityFilter,
} from "@/lib/simulador/filter-enrollment-courses";
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
  conflictTurmaIds?: ReadonlySet<string>;
  onSelect: (course: TurmaOfertadaCourse) => void;
  onSelectGroup?: (group: EnrollmentCourseGroup) => void;
  onCourseDragStart?: (turmaSigaaId: string) => void;
  onCourseDragEnd?: () => void;
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
  conflictTurmaIds,
  onSelect,
  onSelectGroup,
  onCourseDragStart,
  onCourseDragEnd,
}: EnrollmentSidebarProps) {
  const [query, setQuery] = useState("");
  const [eligibilityFilter, setEligibilityFilter] =
    useState<EnrollmentEligibilityFilter>("todas");

  const eligibilityLabels = useMemo(
    () =>
      ENROLLMENT_ELIGIBILITY_FILTER_ORDER.map(
        (value) => ENROLLMENT_ELIGIBILITY_FILTER_LABELS[value]
      ),
    []
  );

  const activeEligibilityLabel =
    ENROLLMENT_ELIGIBILITY_FILTER_LABELS[eligibilityFilter];

  const filteredCurso = useMemo(() => {
    const byEligibility = filterEnrollmentCoursesByEligibility(
      curso,
      eligibilityFilter
    );
    return filterEnrollmentCoursesByQuery(byEligibility, query);
  }, [curso, eligibilityFilter, query]);

  const filteredOptativas = useMemo(() => {
    const byEligibility = filterEnrollmentCoursesByEligibility(
      optativas,
      eligibilityFilter
    );
    return filterEnrollmentCoursesByQuery(byEligibility, query);
  }, [optativas, eligibilityFilter, query]);

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

        <FilterBar
          filters={eligibilityLabels}
          active={activeEligibilityLabel}
          onChange={(label) => {
            const next = ENROLLMENT_ELIGIBILITY_FILTER_ORDER.find(
              (value) => ENROLLMENT_ELIGIBILITY_FILTER_LABELS[value] === label
            );
            if (next) setEligibilityFilter(next);
          }}
          ariaLabel="Filtrar por elegibilidade"
          nowrap
          className="enrollment-eligibility-filter"
        />

        <span className="enrollment-sidebar-meta">
          {totalFiltered} de {totalAvailable}{" "}
          {totalAvailable === 1 ? "disponível" : "disponíveis"}
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
            Nenhuma turma corresponde aos filtros atuais
            {query.trim() ? ` para "${query.trim()}"` : ""}.
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
              conflictTurmaIds={conflictTurmaIds}
              onSelect={onSelect}
              onSelectGroup={onSelectGroup}
              onCourseDragStart={onCourseDragStart}
              onCourseDragEnd={onCourseDragEnd}
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
              conflictTurmaIds={conflictTurmaIds}
              onSelect={onSelect}
              onSelectGroup={onSelectGroup}
              onCourseDragStart={onCourseDragStart}
              onCourseDragEnd={onCourseDragEnd}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
