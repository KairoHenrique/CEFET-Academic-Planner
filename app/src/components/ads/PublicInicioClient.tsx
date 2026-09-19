"use client";

import Link from "next/link";
import { WebAdSlot } from "@/components/ads/WebAdSlot";
import {
  resolveAdsenseSlotBottom,
  resolveAdsenseSlotSidebar,
} from "@/lib/ads/web-ad-config";

/**
 * Pagina publica para o AdSense (crawl + preview de unidades).
 * Sem login — necessaria porque o dashboard autenticado bloqueia a customizacao.
 */
export function PublicInicioClient() {
  const side = resolveAdsenseSlotSidebar();
  const bottom = resolveAdsenseSlotBottom();

  return (
    <div className="public-inicio">
      <header className="public-inicio-header">
        <p className="public-inicio-brand">ACME HUB</p>
        <nav className="public-inicio-nav">
          <Link href="/login">Entrar</Link>
          <Link href="/download">Baixar app</Link>
          <Link href="/planos">Planos</Link>
        </nav>
      </header>

      <div className="public-inicio-layout">
        <aside className="public-inicio-rail" aria-label="Publicidade">
          <WebAdSlot slot={side} format="auto" />
          <Link href="/planos" className="public-inicio-ad-upsell">
            Remover anuncios →
          </Link>
        </aside>

        <article className="public-inicio-main">
          <h1>Planejador academico para o CEFET-MG</h1>
          <p>
            O ACME HUB sincroniza dados do SIGAA e concentra dashboard, calendario,
            disciplinas, faltas, notas, mapa do curso e montagem de grade em uma
            interface moderna — na web e no Android.
          </p>
          <p>
            O uso academico e gratuito. Na versao gratuita podem ser exibidos
            anuncios; o plano opcional remove a propaganda no app e na web.
          </p>
          <ul>
            <li>Sincronizacao com o SIGAA do CEFET-MG</li>
            <li>Notas, faltas e risco de aprovacao</li>
            <li>Calendario academico e lembretes</li>
            <li>Mapa do PPC e simulador de matricula</li>
            <li>App Android com sync e notificacoes</li>
          </ul>
          <p>
            Contato / LGPD:{" "}
            <a href="mailto:acme.hubsuporte@gmail.com">acme.hubsuporte@gmail.com</a>
            {" · "}
            <Link href="/privacidade">Privacidade</Link>
            {" · "}
            <Link href="/termos">Termos</Link>
          </p>
          <div className="public-inicio-cta">
            <Link href="/login" className="btn-gold">
              Acessar o ACME HUB
            </Link>
            <Link href="/download" className="btn-outline">
              Baixar APK
            </Link>
          </div>

          <div className="public-inicio-bottom-ad" aria-label="Publicidade">
            <WebAdSlot slot={bottom} format="horizontal" />
          </div>
        </article>

        <aside className="public-inicio-rail" aria-label="Publicidade">
          <WebAdSlot slot={side} format="auto" />
          <Link href="/planos" className="public-inicio-ad-upsell">
            Remover anuncios →
          </Link>
        </aside>
      </div>
    </div>
  );
}
