"use client";

import { useState } from "react";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardStateCard } from "@/components/dashboard/DashboardStateCard";
import { IntegrationDetailTable } from "@/components/integralizacao/IntegrationDetailTable";
import { IntegrationSummaryCard } from "@/components/integralizacao/IntegrationSummaryCard";
import { IntegrationTotalCard } from "@/components/integralizacao/IntegrationTotalCard";
import { IntegralizacaoSkeleton } from "@/components/integralizacao/IntegralizacaoSkeleton";
import { RegisterHoursModal } from "@/components/integralizacao/RegisterHoursModal";
import { useIntegralizacao } from "@/hooks/useIntegralizacao";

export function IntegralizacaoView() {
  const { data, loading, error, needsSync, refetch, registerHours, isRegistering } =
    useIntegralizacao();
  const [registerOpen, setRegisterOpen] = useState(false);

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
        tutorial="integralizacao"
        tutorialLabel="Como usar Integralização"
      />

      <div className="col-4">
        <IntegrationTotalCard
          totalDone={data.totalDone}
          totalHours={data.totalHours}
          percent={data.percent}
        />
      </div>
      <div className="col-8">
        <IntegrationSummaryCard categories={data.categories} />
      </div>
      <div className="col-12">
        <IntegrationDetailTable
          categories={data.categories}
          onRegisterClick={() => setRegisterOpen(true)}
        />
      </div>

      <RegisterHoursModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        isSaving={isRegistering}
        onSubmit={registerHours}
      />
    </PageGrid>
  );
}
