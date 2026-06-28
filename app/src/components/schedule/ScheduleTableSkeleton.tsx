export function ScheduleTableSkeleton({ compact = false }: { compact?: boolean }) {
  const rows = compact ? 5 : 5;
  const cols = compact ? 5 : 7;

  return (
    <div
      className={`schedule-skeleton ${compact ? "schedule-skeleton-compact" : ""}`}
      aria-busy="true"
      aria-label="Carregando grade semanal"
    >
      <div className="schedule-skeleton-head">
        <div className="skeleton schedule-skeleton-corner" />
        {Array.from({ length: cols }).map((_, index) => (
          <div key={index} className="skeleton schedule-skeleton-time" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="schedule-skeleton-row">
          <div className="skeleton schedule-skeleton-day" />
          {Array.from({ length: cols }).map((__, colIndex) => (
            <div key={colIndex} className="skeleton schedule-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}
