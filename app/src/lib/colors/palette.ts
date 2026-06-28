export interface ColorOption {
  label: string;
  value: string;
}

export const CRUZEIRO_PALETTE: ColorOption[] = [
  { label: "Azul Cruzeiro", value: "#0060B1" },
  { label: "Azul claro", value: "#1A8FE3" },
  { label: "Dourado", value: "#D4A843" },
  { label: "Verde", value: "#3FB950" },
  { label: "Laranja", value: "#D29922" },
  { label: "Vermelho", value: "#F85149" },
  { label: "Rosa", value: "#F47067" },
  { label: "Roxo", value: "#A371F7" },
  { label: "Ciano", value: "#39D0D8" },
];

export const DEFAULT_EVENT_COLOR = CRUZEIRO_PALETTE[2].value;

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const hex = trimmed.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  return null;
}
