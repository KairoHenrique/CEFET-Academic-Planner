import type { IconName } from "@/components/ui/Icon";

export const DEV_PANEL_VIEWS = [
  {
    id: "robots",
    label: "Robôs",
    description: "Disparo manual, contas e assinaturas.",
    icon: "sync" satisfies IconName,
  },
  {
    id: "fila",
    label: "Fila sync",
    description: "Jobs enfileirados e ordem do orquestrador.",
    icon: "calendar" satisfies IconName,
  },
  {
    id: "chaves",
    label: "Chaves",
    description: "Códigos de plano — gerar, listar e revogar.",
    icon: "star" satisfies IconName,
  },
  {
    id: "policy",
    label: "Policy",
    description: "Orquestração §6.6 — cron e worker.",
    icon: "chart" satisfies IconName,
  },
  {
    id: "audit",
    label: "Auditoria",
    description: "Ações sensíveis registradas no ambiente.",
    icon: "clipboard" satisfies IconName,
  },
] as const;

export type DevPanelViewId = (typeof DEV_PANEL_VIEWS)[number]["id"];

export function parseDevPanelView(value: string | null): DevPanelViewId {
  if (value && DEV_PANEL_VIEWS.some((view) => view.id === value)) {
    return value as DevPanelViewId;
  }
  return "robots";
}

export function findDevPanelView(id: DevPanelViewId) {
  return DEV_PANEL_VIEWS.find((view) => view.id === id) ?? DEV_PANEL_VIEWS[0];
}
