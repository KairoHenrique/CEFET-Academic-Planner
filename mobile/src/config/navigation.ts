import type { IconName } from "../ui/Icon";
import type { RootStackParamList } from "../navigation/types";

export interface NavLink {
  route: keyof RootStackParamList;
  label: string;
  icon: IconName;
}

/** Espelho de `app/src/config/navigation.ts` (rotas F28). */
export const navLinks: NavLink[] = [
  { route: "Dashboard", label: "Dashboard", icon: "dashboard" },
  { route: "Calendario", label: "Calendário", icon: "calendar" },
  { route: "Disciplinas", label: "Disciplinas", icon: "books" },
  { route: "Mapa", label: "Mapa do Curso", icon: "map" },
  { route: "Integralizacao", label: "Integralização", icon: "chart" },
  { route: "Simulador", label: "Montar Grade", icon: "calendar" },
];
