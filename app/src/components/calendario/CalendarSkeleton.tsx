export function CalendarSkeleton() {
  return (
    <div className="calendar-skeleton col-12" aria-busy="true" aria-label="Carregando calendário">
      <div className="skeleton calendar-skeleton-header" />
      <div className="calendar-skeleton-grid">
        <div className="skeleton calendar-skeleton-panel calendar-skeleton-panel-lg" />
        <div className="skeleton calendar-skeleton-panel" />
        <div className="skeleton calendar-skeleton-panel" />
        <div className="skeleton calendar-skeleton-panel calendar-skeleton-panel-lg" />
      </div>
    </div>
  );
}
