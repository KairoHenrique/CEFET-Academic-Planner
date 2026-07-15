"use client";

import { useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { CourseMapFlowGraph } from "@/components/mapa/CourseMapFlowGraph";
import { CourseMapGrid } from "@/components/mapa/CourseMapGrid";
import { MapaSkeleton } from "@/components/mapa/MapaSkeleton";
import { MapaStatsBar } from "@/components/mapa/MapaStatsBar";
import { useMapa } from "@/hooks/useMapa";
import { useMapaGrafo } from "@/hooks/useMapaGrafo";

type MapaViewMode = "grade" | "grafo";

export function MapaView() {
  const [mode, setMode] = useState<MapaViewMode>("grade");
  const mapa = useMapa();
  const grafo = useMapaGrafo(mode === "grafo");

  const loading = mapa.loading || (mode === "grafo" && grafo.loading);
  const needsSync = mapa.needsSync || (mode === "grafo" && grafo.needsSync);
  const error =
    mode === "grafo" ? grafo.error ?? mapa.error : mapa.error;

  if (loading && !mapa.data) {
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

  if ((error && !mapa.data) || !mapa.data) {
    return (
      <PageGrid>
        <DashboardStateCard
          variant="error"
          title="Falha ao carregar"
          message={error ?? "Não foi possível carregar o mapa do curso."}
          actionLabel="Tentar novamente"
          onRetry={() => {
            void mapa.refetch();
            if (mode === "grafo") void grafo.refetch();
          }}
        />
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <PageHeader
        eyebrow={`PPC · ${mapa.data.curso}`}
        title="Mapa do"
        highlight="Curso"
        subtitle="Visualize períodos, status das disciplinas e pré-requisitos"
      />

      <div className="col-12">
        <MapaStatsBar stats={mapa.data.stats} />
      </div>
      {!mapa.data.historicoSynced && (
        <div className="col-12 mapa-historico-warning" role="status">
          <p>
            Histórico escolar ainda não sincronizou — disciplinas concluídas podem
            aparecer trancadas. Faça uma sincronização completa (botão Sync na barra).
          </p>
        </div>
      )}

      <div className="col-12 mapa-view-toggle" role="tablist" aria-label="Modo do mapa">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "grade"}
          className={mode === "grade" ? "is-active" : undefined}
          onClick={() => setMode("grade")}
        >
          Grade
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "grafo"}
          className={mode === "grafo" ? "is-active" : undefined}
          onClick={() => setMode("grafo")}
        >
          Grafo
        </button>
      </div>

      <div className="col-12">
        {mode === "grade" ? (
          <CourseMapGrid
            periods={mapa.data.periods}
            statusLabels={mapa.data.statusLabels}
          />
        ) : grafo.loading && !grafo.data ? (
          <MapaSkeleton />
        ) : grafo.error || !grafo.data ? (
          <DashboardStateCard
            variant="error"
            title="Falha ao carregar grafo"
            message={grafo.error ?? "Não foi possível carregar o grafo."}
            actionLabel="Tentar novamente"
            onRetry={() => void grafo.refetch()}
          />
        ) : (
          <CourseMapFlowGraph grafo={grafo.data} />
        )}
      </div>
    </PageGrid>
  );
}
