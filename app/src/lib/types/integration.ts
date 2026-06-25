export interface IntegrationCategory {
  label: string;
  done: number;
  total: number;
  color: "blue" | "gold" | "success" | "warning";
}

export const INTEGRATION_TOTAL_HOURS = 4320;
