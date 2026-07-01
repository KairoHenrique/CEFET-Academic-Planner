import Link from "next/link";
import { PageGrid } from "@/components/layout/PageGrid";
import { PageHeader } from "@/components/layout/PageHeader";

export default function PlanosPage() {
  return (
    <PageGrid>
      <PageHeader
        eyebrow="Assinatura"
        title="Planos"
        subtitle="Escolha o período de acesso. Pagamento via PIX em breve."
      />

      <div className="planos-grid">
        <article className="card planos-card">
          <h2 className="planos-card-title">Trial</h2>
          <p className="planos-card-duration">7 dias · uma vez por CPF</p>
          <p className="planos-card-copy">
            Período de teste gratuito na criação da conta.
          </p>
        </article>

        <article className="card planos-card planos-card--featured">
          <h2 className="planos-card-title">Semestre</h2>
          <p className="planos-card-duration">~6 meses</p>
          <p className="planos-card-copy">
            Acesso completo alinhado ao calendário acadêmico.
          </p>
          <button type="button" className="btn-gold" disabled>
            Assinar via PIX (em breve)
          </button>
        </article>

        <article className="card planos-card">
          <h2 className="planos-card-title">Anual</h2>
          <p className="planos-card-duration">12 meses</p>
          <p className="planos-card-copy">
            Melhor custo para quem usa o app o ano todo.
          </p>
          <button type="button" className="btn-outline" disabled>
            Assinar via PIX (em breve)
          </button>
        </article>
      </div>

      <p className="planos-back">
        <Link href="/">← Voltar ao dashboard</Link>
      </p>
    </PageGrid>
  );
}
