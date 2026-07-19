"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubjectList } from "@/components/disciplinas/SubjectList";
import { useDashboard } from "@/hooks/useDashboard";
import { useDisciplinas } from "@/hooks/useDisciplinas";

export function DisciplinasView() {
  const { items, isLoading } = useDisciplinas();
  const { data: dashboard } = useDashboard();
  const semestreLabel = dashboard?.aluno.semestreAtual;

  const subtitle = isLoading
    ? "Carregando disciplinas do semestre..."
    : items.length > 0
      ? `${items.length} matérias cursando · notas, faltas e atividades`
      : "Sincronize com o SIGAA para ver suas disciplinas";

  return (
    <PageGrid>
      <PageHeader
        eyebrow={semestreLabel ? `Semestre ${semestreLabel}` : "Semestre"}
        title="Disciplinas"
        subtitle={subtitle}
        tutorial="disciplinas"
        tutorialLabel="Como usar Disciplinas"
      />
      <div className="col-12">
        <SubjectList />
      </div>
    </PageGrid>
  );
}
