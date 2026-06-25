"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/calendario", label: "Calendário", icon: "📅" },
  { href: "/disciplinas", label: "Disciplinas", icon: "📚" },
  { href: "/mapa", label: "Mapa do Curso", icon: "🗺️" },
  { href: "/integralizacao", label: "Integralização", icon: "📈" },
  { href: "/simulador", label: "Simulador", icon: "🧮" },
];

export function Navbar() {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    // TODO: Implementar sincronização real com SIGAA
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Navegação principal">
      <div className="navbar-inner">
        {/* Brand */}
        <Link href="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span>Academic Planner</span>
        </Link>

        {/* Navigation Links (Apple-style) */}
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? "active" : ""}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          <button
            className="navbar-sync-btn"
            onClick={handleSync}
            disabled={syncing}
            title="Sincronizar com SIGAA"
          >
            <span style={{ 
              display: "inline-block",
              animation: syncing ? "spin 1s linear infinite" : "none" 
            }}>
              🔄
            </span>
            <span>{syncing ? "Sincronizando..." : "Sync SIGAA"}</span>
          </button>
          <div className="navbar-avatar" title="Minha Conta">
            KH
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </nav>
  );
}
