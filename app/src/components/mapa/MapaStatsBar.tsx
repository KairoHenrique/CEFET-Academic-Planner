import type { MapaStats } from "@/lib/types/mapa-api";

interface MapaStatsBarProps {
  stats: MapaStats;
}

const STAT_ITEMS: {
  key: keyof MapaStats;
  label: string;
  className: string;
}[] = [
  { key: "total", label: "Total", className: "mapa-stat-total" },
  { key: "done", label: "Concluídas", className: "mapa-stat-done" },
  { key: "current", label: "Cursando", className: "mapa-stat-current" },
  { key: "unlocked", label: "Desbloqueadas", className: "mapa-stat-unlocked" },
  { key: "locked", label: "Trancadas", className: "mapa-stat-locked" },
];

export function MapaStatsBar({ stats }: MapaStatsBarProps) {
  return (
    <section className="mapa-stats-bar" aria-label="Resumo do progresso curricular" data-tutorial-id="tutorial-mapa-stats">
      {STAT_ITEMS.map(({ key, label, className }) => (
        <div key={key} className={`mapa-stat-card ${className}`}>
          <span className="mapa-stat-value">{stats[key]}</span>
          <span className="mapa-stat-label">{label}</span>
        </div>
      ))}
    </section>
  );
}
