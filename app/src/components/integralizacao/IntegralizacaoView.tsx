"use client";

import { useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { ChGlossarySection } from "@/components/integralizacao/ChGlossarySection";
import { IntegrationDetailTable } from "@/components/integralizacao/IntegrationDetailTable";
import { IntegrationSummaryCard } from "@/components/integralizacao/IntegrationSummaryCard";
import { IntegrationTotalCard } from "@/components/integralizacao/IntegrationTotalCard";
import { IntegralizacaoSkeleton } from "@/components/integralizacao/IntegralizacaoSkeleton";
import { RegisterHoursModal } from "@/components/integralizacao/RegisterHoursModal";
import { useIntegralizacao } from "@/hooks/useIntegralizacao";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";
import type { IntegralizacaoResponse } from "@/lib/types/integralizacao-api";

const MODULES: ModuleDefinition[] = [
  { id: "total", label: "Total integralizado", colClass: "col-4" },
  { id: "summary", label: "Resumo por categoria", colClass: "col-8" },
  { id: "glossary", label: "Entenda suas horas", colClass: "col-12" },
  { id: "table", label: "Detalhamento de horas", colClass: "col-12" },
];

function renderIntegralizacaoModule(
  id: string,
  data: IntegralizacaoResponse,
  onRegisterClick: () => void
) {
  switch (id) {
    case "total":
      return (
        <IntegrationTotalCard
          totalDone={data.totalDone}
          totalHours={data.totalHours}
          percent={data.percent}
        />
      );
    case "summary":
      return <IntegrationSummaryCard categories={data.categories} />;
    case "glossary":
      return <ChGlossarySection />;
    case "table":
      return (
        <IntegrationDetailTable
          categories={data.categories}
          onRegisterClick={onRegisterClick}
        />
      );
    default:
      return null;
  }
}

export function IntegralizacaoView() {
  const layout = useModuleLayout("integralizacao", MODULES);
  const { data, loading, error, needsSync, refetch, registerHours, isRegistering } =
    useIntegralizacao();
  const [registerOpen, setRegisterOpen] = useState(false);

  if (!layout.hydrated) return null;

  if (loading) {
    return (
      <PageGrid>
        <PageHeader
          eyebrow="Currículo"
          title="Integralização"
          subtitle="Acompanhe horas por categoria e cadastre atividades complementares"
        />
        <IntegralizacaoSkeleton />
      </PageGrid>
    );
  }

  if (needsSync) {
    return (
      <PageGrid>
        <DashboardStateCard
          title="Nenhum dado sincronizado"
          message="Faça login e sincronize com o SIGAA para ver sua integralização."
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
          message={error ?? "Não foi possível carregar a integralização."}
          actionLabel="Tentar novamente"
          onRetry={() => void refetch()}
        />
      </PageGrid>
    );
  }

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Currículo"
        title="Integralização"
        subtitle="Acompanhe horas por categoria e cadastre atividades complementares"
      />

      <ModuleGrid
        layout={layout}
        modules={MODULES}
        renderModule={(id) =>
          renderIntegralizacaoModule(id, data, () => setRegisterOpen(true))
        }
      />

      <RegisterHoursModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        isSaving={isRegistering}
        onSubmit={registerHours}
      />
    </PageGrid>
  );
}
