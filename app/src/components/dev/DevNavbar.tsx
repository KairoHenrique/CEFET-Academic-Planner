"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import {
  DEV_PANEL_VIEWS,
  parseDevPanelView,
  type DevPanelViewId,
} from "@/components/dev/dev-panel-navigation";

interface DevNavbarProps {
  operatorEmail: string;
  onLogout: () => void;
  logoutPending?: boolean;
}

function viewHref(viewId: DevPanelViewId): string {
  return `/dev?view=${viewId}`;
}

/** Navbar /dev — desktop com tabs; mobile com drawer (F28-like). */
export function DevNavbar({
  operatorEmail,
  onLogout,
  logoutPending = false,
}: DevNavbarProps) {
  const searchParams = useSearchParams();
  const activeView = parseDevPanelView(searchParams.get("view"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMobileOpen(false);
  }, [activeView]);

  useEffect(() => {
    document.body.classList.toggle("dev-nav-open", mobileOpen);
    return () => {
      document.body.classList.remove("dev-nav-open");
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <>
      <nav className="dev-navbar" role="navigation" aria-label="Painel operador /dev">
        <div className="dev-navbar-inner">
          <Link
            href="/dev?view=robots"
            className="dev-navbar-brand"
            onClick={() => setMobileOpen(false)}
          >
            <BrandLogo />
            <span className="dev-navbar-brand-text">
              <span className="dev-navbar-brand-name">ACME</span>
              <span className="dev-navbar-brand-badge">/dev</span>
            </span>
          </Link>

          <ul className="dev-navbar-links dev-navbar-links--desktop">
            {DEV_PANEL_VIEWS.map((view) => {
              const active = activeView === view.id;
              return (
                <li key={view.id}>
                  <Link
                    href={viewHref(view.id)}
                    className={active ? "active" : ""}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="dev-navbar-link-icon" aria-hidden>
                      <Icon name={view.icon} size={16} />
                    </span>
                    <span>{view.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="dev-navbar-actions">
            <span className="dev-navbar-operator" title={operatorEmail}>
              {operatorEmail}
            </span>
            <Link
              href="/"
              className="btn-outline dev-action-btn dev-navbar-app-link"
            >
              App aluno
            </Link>
            <button
              type="button"
              className="btn-outline dev-action-btn dev-navbar-logout dev-navbar-logout--desktop"
              onClick={onLogout}
              disabled={logoutPending}
            >
              <Icon name="logout" size={16} aria-hidden />
              Sair
            </button>
            <button
              type="button"
              className="dev-navbar-menu-btn"
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
        className={`dev-mobile-nav-backdrop ${mobileOpen ? "open" : ""}`}
        aria-label="Fechar menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
      />

      <div
        id={menuId}
        className={`dev-mobile-nav ${mobileOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu do painel /dev"
        hidden={!mobileOpen}
      >
        <p className="dev-mobile-nav-title">Painel /dev</p>
        <p className="dev-mobile-nav-operator" title={operatorEmail}>
          {operatorEmail}
        </p>
        <ul className="dev-mobile-nav-list">
          {DEV_PANEL_VIEWS.map((view) => {
            const active = activeView === view.id;
            return (
              <li key={view.id}>
                <Link
                  href={viewHref(view.id)}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon name={view.icon} size={18} />
                  <span>{view.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Icon name="dashboard" size={18} />
              <span>App aluno</span>
            </Link>
          </li>
          <li className="dev-mobile-nav-logout">
            <button
              type="button"
              className="dev-mobile-nav-logout-btn"
              onClick={() => {
                setMobileOpen(false);
                onLogout();
              }}
              disabled={logoutPending}
            >
              <Icon name="logout" size={18} />
              <span>Sair</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}
