"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { brand } from "@/config/brand";
import { navLinks } from "@/config/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { SyncButton } from "@/components/ui/SyncButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { APP_RELEASE } from "@/config/app-download";

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

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", mobileOpen);
    return () => {
      document.body.classList.remove("mobile-nav-open");
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Navegação principal">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
            <BrandLogo />
            <span className="navbar-brand-text navbar-brand-text--full">
              {brand.name.split(" ").map((word, index) => (
                <span key={index} className="navbar-brand-word">
                  {word}
                </span>
              ))}
            </span>
            <span className="navbar-brand-text navbar-brand-text--short">
              ACME HUB
            </span>
          </Link>

          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={isActive(link.href) ? "active" : ""}
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

          <div className="navbar-actions">
            <NotificationBell />
            <SyncButton />
            <ProfileMenu />
            <LogoutButton className="navbar-logout-btn navbar-logout-btn--desktop" />
            <button
              type="button"
              className="navbar-menu-btn"
              data-tutorial-id="nav-menu-mobile"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
              aria-controls={menuId}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={18} />
            </button>
          </div>
        </div>
      </nav>

      <button
        type="button"
        className={`mobile-nav-backdrop ${mobileOpen ? "open" : ""}`}
        aria-label="Fechar menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />

      <div
        id={menuId}
        className={`mobile-nav ${mobileOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        hidden={!mobileOpen}
      >
        <ul className="mobile-nav-list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive(link.href) ? "active" : ""}
                onClick={() => setMobileOpen(false)}
              >
                <Icon name={link.icon} size={18} />
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
          <li className="mobile-nav-download">
            <a
              href={APP_RELEASE.apkPath}
              className="mobile-nav-download-btn"
              download={APP_RELEASE.apkFile}
              onClick={() => setMobileOpen(false)}
            >
              <Icon name="download" size={18} />
              <span>{APP_RELEASE.shortLabel}</span>
            </a>
          </li>
          <li className="mobile-nav-logout">
            <LogoutButton
              className="mobile-nav-logout-btn"
              onLoggedOut={() => setMobileOpen(false)}
            />
          </li>
        </ul>
      </div>
    </>
  );
}
