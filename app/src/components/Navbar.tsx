"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { brand } from "@/config/brand";
import {
  mobileMoreLinks,
  mobileTabLinks,
  navLinks,
} from "@/config/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { SyncButton } from "@/components/ui/SyncButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

function tutorialIdForHref(href: string): string {
  const map: Record<string, string> = {
    "/": "nav-dashboard",
    "/calendario": "nav-calendario",
    "/disciplinas": "nav-disciplinas",
    "/mapa": "nav-mapa",
    "/integralizacao": "nav-integralizacao",
    "/simulador": "nav-simulador",
  };
  return map[href] ?? `nav-${href.replace(/\//g, "")}`;
}

function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();

  const moreActive = mobileMoreLinks.some((link) =>
    isActivePath(pathname, link.href)
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", moreOpen);
    return () => {
      document.body.classList.remove("mobile-nav-open");
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  return (
    <>
      <header className="navbar" role="banner">
        <div className="navbar-inner">
          <Link
            href="/"
            className="navbar-brand"
            onClick={() => setMoreOpen(false)}
          >
            <BrandLogo />
            <span className="navbar-brand-text navbar-brand-text--full">
              {brand.name.split(" ").map((word, index) => (
                <span key={index} className="navbar-brand-word">
                  {word}
                </span>
              ))}
            </span>
            <span className="navbar-brand-text navbar-brand-text--short">
              ACME
            </span>
          </Link>

          <nav className="navbar-desktop-nav" aria-label="Navegação principal">
            <ul className="navbar-links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={
                      isActivePath(pathname, link.href) ? "active" : ""
                    }
                    data-tutorial-id={tutorialIdForHref(link.href)}
                  >
                    <span className="navbar-link-icon">
                      <Icon name={link.icon} size={16} />
                    </span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="navbar-actions">
            <NotificationBell />
            <SyncButton />
            <ProfileMenu />
            <LogoutButton className="navbar-logout-btn navbar-logout-btn--desktop" />
          </div>
        </div>
      </header>

      <nav className="mobile-tabbar" aria-label="Navegação principal">
        {mobileTabLinks.map((link) => {
          const active = isActivePath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-tabbar-item ${active ? "active" : ""}`}
              data-tutorial-id={tutorialIdForHref(link.href)}
              aria-current={active ? "page" : undefined}
            >
              <Icon name={link.icon} size={20} />
              <span>{link.shortLabel ?? link.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`mobile-tabbar-item mobile-tabbar-more ${moreOpen || moreActive ? "active" : ""}`}
          onClick={() => setMoreOpen((open) => !open)}
          aria-label={moreOpen ? "Fechar menu Mais" : "Abrir menu Mais"}
          aria-expanded={moreOpen}
          aria-controls={moreId}
        >
          <Icon name={moreOpen ? "close" : "menu"} size={20} />
          <span>Mais</span>
        </button>
      </nav>

      <button
        type="button"
        className={`mobile-nav-backdrop ${moreOpen ? "open" : ""}`}
        aria-label="Fechar menu"
        tabIndex={moreOpen ? 0 : -1}
        onClick={() => setMoreOpen(false)}
      />

      <div
        id={moreId}
        className={`mobile-more-sheet ${moreOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mais opções"
        hidden={!moreOpen}
      >
        <div className="mobile-more-sheet-handle" aria-hidden="true" />
        <p className="mobile-more-sheet-title">Mais</p>
        <ul className="mobile-more-list">
          {mobileMoreLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={
                  isActivePath(pathname, link.href) ? "active" : ""
                }
                onClick={() => setMoreOpen(false)}
                data-tutorial-id={tutorialIdForHref(link.href)}
              >
                <Icon name={link.icon} size={18} />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mobile-more-footer">
          <LogoutButton
            className="mobile-nav-logout-btn"
            onLoggedOut={() => setMoreOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
