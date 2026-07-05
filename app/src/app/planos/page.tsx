import Link from "next/link";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlanosGrid } from "@/components/planos/PlanosGrid";
import { buildBillingPlansResponse } from "@/lib/billing/build-plans-response";

export default function PlanosPage() {
  const catalog = buildBillingPlansResponse();

  return (
    <PageGrid>
      <PageHeader
        eyebrow="Assinatura"
        title="Planos"
        subtitle="Escolha o período de acesso. Pagamento via PIX em breve."
        tutorial="planos"
      />

      <PlanosGrid catalog={catalog} />

      <p className="planos-back">
        <Link href="/">← Voltar ao dashboard</Link>
      </p>
    </PageGrid>
  );
}
