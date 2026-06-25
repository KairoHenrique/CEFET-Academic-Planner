"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { SubjectList } from "@/components/disciplinas/SubjectList";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "list", label: "Lista de disciplinas", colClass: "col-12" },
];

export function DisciplinasView() {
  const layout = useModuleLayout("disciplinas", MODULES);
  if (!layout.hydrated) return null;

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Semestre 2026.1"
        title="Disciplinas"
        subtitle="7 matérias cursando · notas, faltas e atividades"
      />
      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={(id) => (id === "list" ? <SubjectList /> : null)}
      />
    </PageGrid>
  );
}
