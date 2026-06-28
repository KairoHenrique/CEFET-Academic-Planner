export function MapaSkeleton() {
  return (
    <div
      className="mapa-skeleton col-12"
      aria-busy="true"
      aria-label="Carregando mapa do curso"
    >
      <div className="mapa-skeleton-stats">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton mapa-skeleton-stat" />
        ))}
      </div>
      <div className="skeleton mapa-skeleton-grid" />
    </div>
  );
}
