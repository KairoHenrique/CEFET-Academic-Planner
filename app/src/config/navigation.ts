import type { IconName } from "@/components/ui/Icon";

export interface NavLink {
  href: string;
  label: string;
  icon: IconName;
  /** Rótulo curto na bottom bar (mobile). */
  shortLabel?: string;
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard", shortLabel: "Início", icon: "dashboard" },
  { href: "/calendario", label: "Calendário", shortLabel: "Agenda", icon: "calendar" },
  { href: "/disciplinas", label: "Disciplinas", shortLabel: "Matérias", icon: "books" },
  { href: "/mapa", label: "Mapa do Curso", shortLabel: "Mapa", icon: "map" },
  { href: "/integralizacao", label: "Integralização", shortLabel: "Integral.", icon: "chart" },
  { href: "/simulador", label: "Montar Grade", shortLabel: "Grade", icon: "calculator" },
];

/** Abas principais da bottom bar (≤768px). */
export const mobileTabLinks: NavLink[] = navLinks.slice(0, 4);

/** Links secundários no painel “Mais”. */
export const mobileMoreLinks: NavLink[] = navLinks.slice(4);
