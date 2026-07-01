"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { CourseMapGrid } from "@/components/mapa/CourseMapGrid";
import { MapaSkeleton } from "@/components/mapa/MapaSkeleton";
import { MapaStatsBar } from "@/components/mapa/MapaStatsBar";
import { useMapa } from "@/hooks/useMapa";

export function MapaView() {
  const { data, loading, error, needsSync, refetch } = useMapa();

  if (loading) {
    return (
      <PageGrid>
        <PageHeader
          eyebrow="PPC · Eng. Computação"
          title="Mapa do"
          highlight="Curso"
          subtitle="Visualize períodos, status das disciplinas e pré-requisitos"
        />
        <MapaSkeleton />
      </PageGrid>
    );
  }

  if (needsSync) {
    return (
      <PageGrid>
        <DashboardStateCard
          title="Nenhum dado sincronizado"
          message="Faça login e sincronize com o SIGAA para ver o mapa do curso."
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
          message={error ?? "Não foi possível carregar o mapa do curso."}
          actionLabel="Tentar novamente"
          onRetry={() => void refetch()}
        />
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <PageHeader
        eyebrow={`PPC · ${data.curso}`}
        title="Mapa do"
        highlight="Curso"
        subtitle="Visualize períodos, status das disciplinas e pré-requisitos"
      />

      <div className="col-12">
        <MapaStatsBar stats={data.stats} />
      </div>
      {!data.historicoSynced && (
        <div className="col-12 mapa-historico-warning" role="status">
          <p>
            Histórico escolar ainda não sincronizou — disciplinas concluídas podem
            aparecer trancadas. Faça uma sincronização completa (botão Sync na barra).
          </p>
        </div>
      )}
      <div className="col-12">
        <CourseMapGrid periods={data.periods} statusLabels={data.statusLabels} />
      </div>
    </PageGrid>
  );
}
