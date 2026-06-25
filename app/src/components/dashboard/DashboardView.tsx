"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { SubjectsGrid } from "@/components/dashboard/SubjectsGrid";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { WeeklySchedulePreview } from "@/components/dashboard/WeeklySchedulePreview";
import { IntegrationProgress } from "@/components/dashboard/IntegrationProgress";
import { SyncButton } from "@/components/ui/SyncButton";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "stats", label: "Indicadores", colClass: "col-12" },
  { id: "tasks", label: "Próximas entregas", colClass: "col-8" },
  { id: "integration", label: "Integralização", colClass: "col-4" },
  { id: "schedule", label: "Grade semanal", colClass: "col-12" },
  { id: "subjects", label: "Disciplinas", colClass: "col-12" },
];

export function DashboardView() {
  const layout = useModuleLayout("dashboard", MODULES);

  const renderModule = (id: string) => {
    switch (id) {
      case "stats":
        return <StatsRow />;
      case "tasks":
        return <UpcomingTasks />;
      case "integration":
        return <IntegrationProgress />;
      case "schedule":
        return <WeeklySchedulePreview />;
      case "subjects":
        return <SubjectsGrid />;
      default:
        return null;
    }
  };

  if (!layout.hydrated) return null;

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Semestre 2026.1"
        title="Bom dia,"
        highlight="Kairo"
        subtitle="Engenharia de Computação · CEFET-MG Divinópolis"
      />

      <div className="col-12 dashboard-sync-row">
        <SyncButton />
      </div>

      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={renderModule}
      />
    </PageGrid>
  );
}
