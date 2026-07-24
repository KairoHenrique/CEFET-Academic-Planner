"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnrollmentSimulator } from "@/components/simulador/EnrollmentSimulator";
import { EnrollmentSyncBar } from "@/components/simulador/EnrollmentSyncBar";
import { ScheduleTableSkeleton } from "@/components/schedule/ScheduleTableSkeleton";
import { CourseMapFlowGraph } from "@/components/mapa/CourseMapFlowGraph";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { MapaSkeleton } from "@/components/mapa/MapaSkeleton";
import { useTurmasSelecionadasSync } from "@/hooks/useTurmasSelecionadasSync";
import { LOAD_TURMAS_SELECIONADAS_EVENT } from "@/components/simulador/EnrollmentSimulator";
import { useMapaGrafo } from "@/hooks/useMapaGrafo";
import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { filterSimuladorTurmas } from "@/lib/simulador/turma-course-utils";

export function MatriculaView() {
  const turmas = useTurmasOfertadas();
  // O Simulador sempre precisa do catálogo global.
  // A sincronização manual agora é exclusiva para "Minhas Turmas".
  const sync = useTurmasSelecionadasSync();
  const grafo = useMapaGrafo();

  const semestreLabel =
    turmas.data?.semestre ?? resolveNextAcademicSemesterLabel(new Date());

  const visibleTurmas = useMemo(
    () => (turmas.data ? filterSimuladorTurmas(turmas.data) : null),
    [turmas.data]
  );

  if (turmas.loading) {
    return (
      <PageGrid>
        <PageHeader
          eyebrow="Planejamento"
          title="Montar Grade"
          highlight={semestreLabel}
        subtitle="Carregando turmas ofertadas do SIGAA…"
        tutorial="simulador"
        tutorialLabel="Como montar a grade"
      />
        <div className="col-12">
          <div className="card enrollment-card">
            <ScheduleTableSkeleton compact />
          </div>
        </div>
      </PageGrid>
    );
  }

  if (turmas.needsSync) {
    return (
      <PageGrid>
        <PageHeader
          eyebrow="Planejamento"
          title="Montar Grade"
          highlight={semestreLabel}
        subtitle="Sincronize com o SIGAA para montar sua grade."
        tutorial="simulador"
        tutorialLabel="Como montar a grade"
      />
        <div className="col-12">
          <section className="card enrollment-state-card">
            <p className="enrollment-state-message">
              Faça login e sincronize com o SIGAA para ver as turmas ofertadas do próximo
              semestre.
            </p>
            <Link href="/login" className="btn-gold">
              Ir para login
            </Link>
          </section>
        </div>
      </PageGrid>
    );
  }

  if (turmas.error || !turmas.data) {
    return (
      <PageGrid>
        <PageHeader
          eyebrow="Planejamento"
          title="Montar Grade"
          highlight={semestreLabel}
        subtitle="Não foi possível carregar as turmas."
        tutorial="simulador"
        tutorialLabel="Como montar a grade"
      />
        <div className="col-12">
          <section className="card enrollment-state-card enrollment-state-card--error" role="alert">
            <p className="enrollment-state-message">
              {turmas.error ?? "Erro desconhecido ao carregar turmas ofertadas."}
            </p>
            <button type="button" className="btn-gold" onClick={() => void turmas.refetch()}>
              Tentar novamente
            </button>
          </section>
        </div>
      </PageGrid>
    );
  }

  const showEmptyState =
    (turmas.data.empty || !visibleTurmas?.hasVisibleCourses) && !sync.syncing;

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Planejamento"
        title="Montar Grade"
        highlight={turmas.data.semestre}
        subtitle="Monte sua grade do próximo semestre com turmas do SIGAA"
        tutorial="simulador"
        tutorialLabel="Como montar a grade"
      />

      <div className="col-12">
        <article className="card enrollment-card">
          <EnrollmentSyncBar
            syncedAt={turmas.data.syncedAt}
            syncing={sync.syncing}
            syncError={sync.error}
            passwordPromptOpen={sync.passwordPromptOpen}
            onRequestSync={() => sync.requestSync((selectedTurmas) => {
              window.dispatchEvent(
                new CustomEvent(LOAD_TURMAS_SELECIONADAS_EVENT, { detail: { turmas: selectedTurmas } })
              );
            })}
            onClosePasswordPrompt={() => sync.setPasswordPromptOpen(false)}
            onSubmitPassword={(password) => sync.submitPasswordAndSync(password, (selectedTurmas) => {
              window.dispatchEvent(
                new CustomEvent(LOAD_TURMAS_SELECIONADAS_EVENT, { detail: { turmas: selectedTurmas } })
              );
            })}
          />

          {showEmptyState ? (
            <section className="enrollment-empty-inline">
              <p className="enrollment-state-message">
                {turmas.data.empty
                  ? `Nenhuma turma ofertada encontrada para ${turmas.data.semestre}.`
                  : "Não há turmas pendentes para você neste semestre — as ofertas restantes já foram concluídas."}
              </p>
              <button
                type="button"
                className="btn-gold"
                onClick={() => sync.requestSync()}
              >
                Sincronizar Minhas Turmas
              </button>
            </section>
          ) : (
            <EnrollmentSimulator data={turmas.data} />
          )}
        </article>
      </div>

      <div className="col-12">
        {grafo.loading && !grafo.data ? (
          <MapaSkeleton />
        ) : grafo.error || !grafo.data ? (
          <DashboardStateCard
            variant="error"
            title="Falha ao carregar grafo"
            message={grafo.error ?? "Não foi possível carregar o grafo de pré-requisitos."}
            actionLabel="Tentar novamente"
            onRetry={() => void grafo.refetch()}
          />
        ) : (
          <CourseMapFlowGraph grafo={grafo.data} />
        )}
      </div>
    </PageGrid>
  );
}
