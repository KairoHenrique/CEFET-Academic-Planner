"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnrollmentSimulator } from "@/components/simulador/EnrollmentSimulator";
import { EnrollmentSyncBar } from "@/components/simulador/EnrollmentSyncBar";
import { ScheduleTableSkeleton } from "@/components/schedule/ScheduleTableSkeleton";
import { useTurmasOfertadas } from "@/hooks/useTurmasOfertadas";
import { useTurmasOfertadasSync } from "@/hooks/useTurmasOfertadasSync";
import { resolveNextAcademicSemesterLabel } from "@/lib/academic/resolve-academic-semester";
import { filterSimuladorTurmas } from "@/lib/simulador/turma-course-utils";

export function MatriculaView() {
  const turmas = useTurmasOfertadas();
  const sync = useTurmasOfertadasSync({ autoRun: true });

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
          syncProgress={sync.progress}
          syncStepLabel={sync.stepLabel}
          syncError={sync.error}
            syncMessage={sync.lastMessage}
            syncMessageTone={sync.lastMessageTone}
            passwordPromptOpen={sync.passwordPromptOpen}
            onRequestSync={(force) => sync.requestSync({ force: force === true })}
            onClosePasswordPrompt={() => sync.setPasswordPromptOpen(false)}
            onSubmitPassword={(password) => sync.submitPasswordAndSync(password, { force: true })}
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
                onClick={() => sync.requestSync({ force: true })}
              >
                Buscar turmas no SIGAA
              </button>
            </section>
          ) : (
            <EnrollmentSimulator data={turmas.data} />
          )}
        </article>
      </div>
    </PageGrid>
  );
}
