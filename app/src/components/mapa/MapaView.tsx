"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { CourseMapGrid } from "@/components/mapa/CourseMapGrid";
import { MapaSkeleton } from "@/components/mapa/MapaSkeleton";
import { MapaStatsBar } from "@/components/mapa/MapaStatsBar";
import { useMapa } from "@/hooks/useMapa";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";
import type { MapaResponse } from "@/lib/types/mapa-api";

const MODULES: ModuleDefinition[] = [
  { id: "stats", label: "Resumo do progresso", colClass: "col-12" },
  { id: "map", label: "Mapa do curso", colClass: "col-12" },
];

function renderMapaModule(id: string, data: MapaResponse) {
  switch (id) {
    case "stats":
      return <MapaStatsBar stats={data.stats} />;
    case "map":
      return (
        <CourseMapGrid
          periods={data.periods}
          statusLabels={data.statusLabels}
        />
      );
    default:
      return null;
  }
}

export function MapaView() {
  const layout = useModuleLayout("mapa", MODULES);
  const { data, loading, error, needsSync, refetch } = useMapa();

  if (!layout.hydrated) return null;

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

      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={(id) => renderMapaModule(id, data)}
      />
    </PageGrid>
  );
}
