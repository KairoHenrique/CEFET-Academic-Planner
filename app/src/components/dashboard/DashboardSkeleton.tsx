export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton col-12" aria-busy="true" aria-label="Carregando dashboard">
      <div className="skeleton dashboard-skeleton-header" />
      <div className="stats-module-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card stat-card">
            <div className="skeleton dashboard-skeleton-stat" />
          </div>
        ))}
      </div>
      <div className="dashboard-skeleton-grid">
        <div className="skeleton dashboard-skeleton-panel" />
        <div className="skeleton dashboard-skeleton-panel dashboard-skeleton-panel-sm" />
      </div>
    </div>
  );
}
