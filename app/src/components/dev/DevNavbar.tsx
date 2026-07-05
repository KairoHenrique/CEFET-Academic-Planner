"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

export function DevNavbar({
  operatorEmail,
  onLogout,
  logoutPending = false,
}: DevNavbarProps) {
  const searchParams = useSearchParams();
  const activeView = parseDevPanelView(searchParams.get("view"));

  return (
    <nav className="dev-navbar" role="navigation" aria-label="Painel operador /dev">
      <div className="dev-navbar-inner">
        <Link href="/dev?view=robots" className="dev-navbar-brand">
          <BrandLogo />
          <span className="dev-navbar-brand-text">
            <span className="dev-navbar-brand-name">ACME</span>
            <span className="dev-navbar-brand-badge">/dev</span>
          </span>
        </Link>

        <ul className="dev-navbar-links">
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
          <Link href="/" className="btn-outline dev-action-btn dev-navbar-app-link">
            App aluno
          </Link>
          <button
            type="button"
            className="btn-outline dev-action-btn dev-navbar-logout"
            onClick={onLogout}
            disabled={logoutPending}
          >
            <Icon name="logout" size={16} aria-hidden />
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
