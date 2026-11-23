"use client";

import Link from "next/link";

/**
 * Pagina publica de apresentacao do ACME HUB.
 */
export function PublicInicioClient() {
  return (
    <div className="public-inicio">
      <header className="public-inicio-header">
        <p className="public-inicio-brand">ACME HUB</p>
        <nav className="public-inicio-nav">
          <Link href="/login">Entrar</Link>
          <Link href="/download">Baixar app</Link>
        </nav>
      </header>

      <div className="public-inicio-layout">
        <article className="public-inicio-main">
          <h1>Planejador academico para o CEFET-MG</h1>
          <p>
            O ACME HUB sincroniza dados do SIGAA e concentra dashboard, calendario,
            disciplinas, faltas, notas, mapa do curso e montagem de grade em uma
            interface moderna — na web e no Android.
          </p>
          <p>O uso acadêmico é gratuito na web e no Android.</p>
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
        </article>
      </div>
    </div>
  );
}
