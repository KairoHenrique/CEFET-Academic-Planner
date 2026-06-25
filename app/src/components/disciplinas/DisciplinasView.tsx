"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { SubjectList } from "@/components/disciplinas/SubjectList";
import { useDisciplinas } from "@/hooks/useDisciplinas";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "list", label: "Lista de disciplinas", colClass: "col-12" },
];

export function DisciplinasView() {
  const layout = useModuleLayout("disciplinas", MODULES);
  const { items, isLoading } = useDisciplinas();

  if (!layout.hydrated) return null;

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
      />
      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={(id) => (id === "list" ? <SubjectList /> : null)}
      />
    </PageGrid>
  );
}
