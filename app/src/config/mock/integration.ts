export const integrationCategories = [
  { label: "Obrigatória", done: 570, total: 3105, pending: 2535, color: "blue" as const },
  { label: "Optativa", done: 120, total: 360, pending: 240, color: "gold" as const },
  { label: "Complementar", done: 0, total: 375, pending: 375, color: "success" as const },
  { label: "Extensão", done: 0, total: 450, pending: 450, color: "warning" as const },
  { label: "Flexibilizada", done: 0, total: 30, pending: 30, color: "blue" as const },
];

export { INTEGRATION_TOTAL_HOURS } from "@/lib/types/integration";
