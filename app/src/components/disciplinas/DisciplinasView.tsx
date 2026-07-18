"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubjectList } from "@/components/disciplinas/SubjectList";
import { useDisciplinas } from "@/hooks/useDisciplinas";

export function DisciplinasView() {
  const { items, isLoading } = useDisciplinas();

  const subtitle = isLoading
    ? "Carregando disciplinas do semestre..."
    : items.length > 0
      ? `${items.length} matérias cursando · notas, faltas e atividades`
      : "Sincronize com o SIGAA para ver suas disciplinas";

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Semestre 2026.1"
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
