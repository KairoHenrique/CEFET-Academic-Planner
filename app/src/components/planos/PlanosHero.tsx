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
            <p className="planos-hero-eyebrow">Anúncios</p>
            <h1 className="planos-hero-title">Remover propaganda</h1>
          </div>
          <PageTutorialHelpButton tutorialId="planos" label="Como funciona" />
        </div>
        <p className="planos-hero-subtitle">{subtitle}</p>
      </div>

      <div className="planos-hero-pills" role="list">
        <span className="planos-pill" role="listitem">
          App gratuito para sempre
        </span>
        <span className="planos-pill" role="listitem">
          Pagamento via PIX (web)
        </span>
      </div>

      {showExploreLink ? (
        <Link href="/" className="planos-hero-explore">
          Continuar com anúncios →
        </Link>
      ) : null}
    </header>
  );
}
