"use client";

import Link from "next/link";
import { PageTutorialHelpButton } from "@/components/tutorial/PageTutorialHelpButton";

interface PlanosHeroProps {
  subtitle: string;
  showExploreLink?: boolean;
}

export function PlanosHero({ subtitle, showExploreLink = false }: PlanosHeroProps) {
  return (
    <header className="planos-hero">
      <div className="planos-hero-copy">
        <div className="planos-hero-title-row">
          <div>
            <p className="planos-hero-eyebrow">Assinatura</p>
            <h1 className="planos-hero-title">Escolha seu plano</h1>
          </div>
          <PageTutorialHelpButton tutorialId="planos" label="Como assinar" />
        </div>
        <p className="planos-hero-subtitle">{subtitle}</p>
      </div>

      <div className="planos-hero-pills" role="list">
        <span className="planos-pill" role="listitem">
          7 dias grátis no cadastro
        </span>
        <span className="planos-pill" role="listitem">
          Pagamento via PIX
        </span>
      </div>

      {showExploreLink ? (
        <Link href="/" className="planos-hero-explore">
          Explorar o ACME com trial ativo →
        </Link>
      ) : null}
    </header>
  );
}
