"use client";

import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { ModuleGrid } from "@/components/layout/ModuleGrid";
import {
  IntegrationDetailTable,
  IntegrationSummaryCard,
  IntegrationTotalCard,
} from "@/components/integralizacao/IntegrationTable";
import {
  useModuleLayout,
  type ModuleDefinition,
} from "@/hooks/useModuleLayout";

const MODULES: ModuleDefinition[] = [
  { id: "total", label: "Total integralizado", colClass: "col-4" },
  { id: "summary", label: "Resumo por categoria", colClass: "col-8" },
  { id: "table", label: "Detalhamento de horas", colClass: "col-12" },
];

export function IntegralizacaoView() {
  const layout = useModuleLayout("integralizacao", MODULES);

  const renderModule = (id: string) => {
    switch (id) {
      case "total":
        return <IntegrationTotalCard />;
      case "summary":
        return <IntegrationSummaryCard />;
      case "table":
        return <IntegrationDetailTable />;
      default:
        return null;
    }
  };

  if (!layout.hydrated) return null;

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
        renderModule={renderModule}
      />
    </PageGrid>
  );
}
