import { formatRg } from "@/lib/engine/rg";

interface RgImpactLabelProps {
  current: number | null;
  simulated: number | null;
}

export function RgImpactLabel({ current, simulated }: RgImpactLabelProps) {
  if (simulated === null || current === null) return null;
  const delta = simulated - current;
  const sign = delta >= 0 ? "+" : "";
  return (
    <span className={`rg-impact ${delta >= 0 ? "positive" : "negative"}`}>
      RG: {formatRg(current)} → {formatRg(simulated)} ({sign}
      {delta.toFixed(2)})
    </span>
  );
}
