import type { IconName } from "@/components/ui/Icon";

export interface NavLink {
  href: string;
  label: string;
  icon: IconName;
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/calendario", label: "Calendário", icon: "calendar" },
  { href: "/disciplinas", label: "Disciplinas", icon: "books" },
  { href: "/mapa", label: "Mapa do Curso", icon: "map" },
  { href: "/integralizacao", label: "Integralização", icon: "chart" },
  { href: "/simulador", label: "Simulador", icon: "calculator" },
];
