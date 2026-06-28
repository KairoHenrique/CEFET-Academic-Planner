"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { brand } from "@/config/brand";
import { navLinks } from "@/config/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Icon } from "@/components/ui/Icon";
import { SyncButton } from "@/components/ui/SyncButton";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Navegação principal">
        <div className="navbar-inner">
          <Link href="/" className="navbar-brand">
            <BrandLogo />
            <span>{brand.name}</span>
          </Link>

          <ul className="navbar-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={isActive(link.href) ? "active" : ""}
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
            <button
              type="button"
              className="navbar-menu-btn"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileOpen}
            >
              <Icon name={mobileOpen ? "close" : "menu"} size={18} />
            </button>

            <SyncButton />

            <ProfileMenu />

            <LogoutButton />
          </div>
        </div>
      </nav>

      <div
        className={`mobile-nav ${mobileOpen ? "open" : ""}`}
        role="dialog"
        aria-label="Menu de navegação"
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
