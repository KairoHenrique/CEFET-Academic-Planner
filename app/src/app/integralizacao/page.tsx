import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { IntegrationTable } from "@/components/integralizacao/IntegrationTable";

export default function IntegralizacaoPage() {
  return (
    <PageGrid>
      <PageHeader
        eyebrow="Currículo"
        title="Integralização"
        subtitle="Acompanhe horas por categoria e cadastre atividades complementares"
      />
      <IntegrationTable />
    </PageGrid>
  );
}
