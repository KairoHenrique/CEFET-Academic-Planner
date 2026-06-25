"use client";

import { useEffect, useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { SubjectsGrid } from "@/components/dashboard/SubjectsGrid";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { WeeklySchedulePreview } from "@/components/dashboard/WeeklySchedulePreview";
import { IntegrationProgress } from "@/components/dashboard/IntegrationProgress";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { useDashboard } from "@/hooks/useDashboard";
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia,";
  if (hour < 18) return "Boa tarde,";
  return "Boa noite,";
}

export function DashboardView() {
  const layout = useModuleLayout("dashboard", MODULES);
  const { data, loading, error, needsSync, refetch } = useDashboard();
  const [greeting, setGreeting] = useState("Olá,");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  if (!layout.hydrated) return null;

  if (loading) {
    return (
      <PageGrid>
        <DashboardSkeleton />
      </PageGrid>
    );
  }

  if (needsSync) {
    return (
      <PageGrid>
        <DashboardStateCard
          title="Nenhum dado sincronizado"
          message="Faça login e sincronize com o SIGAA para ver seu dashboard acadêmico."
          actionLabel="Ir para login"
          actionHref="/login"
        />
      </PageGrid>
    );
  }

  if (error || !data) {
    return (
      <PageGrid>
        <DashboardStateCard
          variant="error"
          title="Falha ao carregar"
          message={error ?? "Não foi possível carregar o dashboard."}
          actionLabel="Tentar novamente"
          onRetry={() => void refetch()}
        />
      </PageGrid>
    );
  }

  const renderModule = (id: string) => {
    switch (id) {
      case "stats":
        return <StatsRow stats={data.stats} />;
      case "tasks":
        return <UpcomingTasks tasks={data.tarefas} />;
      case "integration":
        return <IntegrationProgress integralizacao={data.integralizacao} />;
      case "schedule":
        return <WeeklySchedulePreview />;
      case "subjects":
        return <SubjectsGrid disciplinas={data.disciplinas} />;
      default:
        return null;
    }
  };

  return (
    <PageGrid>
      <PageHeader
        eyebrow={`Semestre ${data.aluno.semestreAtual}`}
        title={greeting}
        highlight={data.aluno.nome}
        subtitle={`${data.aluno.curso} · CEFET-MG Divinópolis`}
      />

      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={renderModule}
      />
    </PageGrid>
  );
}
