import Link from "next/link";
import type { PlanosFlow } from "@/lib/billing/subscription-access-client";

interface PlanosContextBannerProps {
  flow: PlanosFlow;
}

const BANNER_COPY: Record<
  Exclude<PlanosFlow, "exists">,
  { title: string; body: string; tone: "welcome" | "renew" | "pending" }
> = {
  welcome: {
    tone: "welcome",
    title: "Conta criada com sucesso",
    body: "Seu trial de 7 dias já está ativo. Assine agora para garantir acesso contínuo ou explore o ACME enquanto isso.",
  },
  renew: {
    tone: "renew",
    title: "Assinatura necessária",
    body: "Seu trial ou plano expirou. Escolha um período abaixo e pague via PIX para voltar a usar o ACME.",
  },
  pending: {
    tone: "pending",
    title: "Pagamento em andamento",
    body: "Há um PIX pendente na sua conta. Conclua o pagamento ou escolha um novo plano.",
  },
};

export function PlanosContextBanner({ flow }: PlanosContextBannerProps) {
  if (flow === "exists") {
    return null;
  }

  const copy = BANNER_COPY[flow];

  return (
    <section
      className={`planos-context-banner planos-context-banner--${copy.tone}`}
      aria-labelledby="planos-context-title"
    >
      <div className="planos-context-banner-inner">
        <div>
          <h2 id="planos-context-title" className="planos-context-banner-title">
            {copy.title}
          </h2>
          <p className="planos-context-banner-body">{copy.body}</p>
        </div>
        {flow === "welcome" ? (
          <Link href="/" className="btn-outline planos-context-banner-action">
            Explorar o app
          </Link>
        ) : null}
      </div>
    </section>
  );
}
