import type { DevRobotRunRequest } from "@/lib/dev-panel/types";

export type DevRobotId = "r1" | "r2" | "r3";

export type DevRobotTargetScope = "cpf" | "global";

export interface DevRobotDefinition {
  id: DevRobotId;
  label: string;
  description: string;
  endpoint: string;
  /** Escopo primário do robô no painel ops. */
  targetScope: DevRobotTargetScope;
  supportsIndividual: boolean;
  supportsGlobal: boolean;
}

export const DEV_ROBOT_DEFINITIONS: DevRobotDefinition[] = [
  {
    id: "r1",
    label: "R1 — Portal e turmas",
    description: "Sync por CPF — portal, turma virtual e histórico (pipeline deep).",
    endpoint: "POST /api/sync",
    targetScope: "cpf",
    supportsIndividual: true,
    supportsGlobal: true,
  },
  {
    id: "r2",
    label: "R2 — Calendário global",
    description: "Snapshot acadêmico compartilhado — calendario_academico (B66).",
    endpoint: "POST /api/sync/calendario",
    targetScope: "global",
    supportsIndividual: true,
    supportsGlobal: true,
  },
  {
    id: "r3",
    label: "R3 — Turmas ofertadas",
    description: "Catálogo global por curso — turmas_ofertadas (B67).",
    endpoint: "POST /api/sync/turmas",
    targetScope: "global",
    supportsIndividual: true,
    supportsGlobal: true,
  },
];

export function findDevRobotDefinition(id: DevRobotId): DevRobotDefinition {
  return DEV_ROBOT_DEFINITIONS.find((robot) => robot.id === id) ?? DEV_ROBOT_DEFINITIONS[0];
}

export function selectionForRobot(id: DevRobotId): DevRobotRunRequest["robots"] {
  return {
    r1: id === "r1",
    r2: id === "r2",
    r3: id === "r3",
  };
}
