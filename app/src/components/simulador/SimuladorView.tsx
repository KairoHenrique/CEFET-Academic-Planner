"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { GradeSimulator } from "@/components/simulador/GradeSimulator";
import { EnrollmentSimulator } from "@/components/simulador/EnrollmentSimulator";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "grades", label: "Simulador de notas", colClass: "col-5" },
  { id: "enrollment", label: "Simulador de matrícula", colClass: "col-7" },
];

export function SimuladorView() {
  const layout = useModuleLayout("simulador", MODULES);

  const renderModule = (id: string) => {
    switch (id) {
      case "grades":
        return <GradeSimulator />;
      case "enrollment":
        return <EnrollmentSimulator />;
      default:
        return null;
    }
  };

  if (!layout.hydrated) return null;

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Planejamento"
        title="Simulador"
        subtitle="Simule notas e monte sua grade · clique nas atividades para detalhes"
      />

      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={renderModule}
      />
    </PageGrid>
  );
}
