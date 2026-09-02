"use client";

import { useEffect, useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { SubjectsGrid } from "@/components/dashboard/SubjectsGrid";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { WeeklySchedulePreview } from "@/components/dashboard/WeeklySchedulePreview";
import { IntegrationProgress } from "@/components/dashboard/IntegrationProgress";
import { RuSaldoChip } from "@/components/dashboard/RuSaldoChip";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { useDashboard } from "@/hooks/useDashboard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia,";
  if (hour < 18) return "Boa tarde,";
  return "Boa noite,";
}

export function DashboardView() {
  const { data, loading, error, needsSync, refetch } = useDashboard();
  const [greeting, setGreeting] = useState("Olá,");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

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

  return (
    <PageGrid>
      <PageHeader
        eyebrow={`Semestre ${data.aluno.semestreAtual}`}
        title={greeting}
        highlight={data.aluno.nome}
        subtitle={`${data.aluno.curso} · CEFET-MG Divinópolis`}
        tutorial="dashboard"
        trailing={
          <RuSaldoChip
            refeicoesDisponiveis={data.ru?.refeicoesDisponiveis ?? null}
          />
        }
      />

      <div className="col-12">
        <StatsRow stats={data.stats} />
      </div>
      <div className="col-8">
        <UpcomingTasks tasks={data.tarefas} />
      </div>
      <div className="col-4">
        <IntegrationProgress integralizacao={data.integralizacao} />
      </div>
      <div className="col-12">
        <WeeklySchedulePreview />
      </div>
      <div className="col-12">
        <SubjectsGrid disciplinas={data.disciplinas} />
      </div>
    </PageGrid>
  );
}
