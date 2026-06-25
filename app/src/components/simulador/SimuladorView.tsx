"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { GradeSimulator } from "@/components/simulador/GradeSimulator";
import { EnrollmentSimulator } from "@/components/simulador/EnrollmentSimulator";
import {
  ModuleLayoutBar,
  ModuleShell,
} from "@/components/layout/ModuleLayout";
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

  if (!layout.hydrated) return null;

  const moduleContent: Record<string, React.ReactNode> = {
    grades: <GradeSimulator />,
    enrollment: <EnrollmentSimulator />,
  };

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Planejamento"
        title="Simulador"
        subtitle="Simule notas e monte sua grade · clique nas atividades para detalhes"
      />

      <ModuleLayoutBar
        editMode={layout.editMode}
        onToggleEdit={() => layout.setEditMode((v) => !v)}
        onReset={layout.resetLayout}
      />

      {layout.order.map((moduleId) => {
        const module = MODULES.find((m) => m.id === moduleId);
        if (!module) return null;
        const hidden = layout.hidden.includes(module.id);
        if (hidden && !layout.editMode) return null;

        return (
          <div key={module.id} className={module.colClass}>
            <ModuleShell
              label={module.label}
              editMode={layout.editMode}
              hidden={hidden}
              onMoveUp={() => layout.moveModule(module.id, -1)}
              onMoveDown={() => layout.moveModule(module.id, 1)}
              onToggle={() => layout.toggleModule(module.id)}
            >
              {moduleContent[module.id]}
            </ModuleShell>
          </div>
        );
      })}
    </PageGrid>
  );
}
