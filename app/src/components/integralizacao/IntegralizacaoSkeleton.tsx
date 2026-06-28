export function IntegralizacaoSkeleton() {
  return (
    <div
      className="integralizacao-skeleton col-12"
      aria-busy="true"
      aria-label="Carregando integralização"
    >
      <div className="integralizacao-skeleton-top">
        <div className="skeleton integralizacao-skeleton-donut" />
        <div className="skeleton integralizacao-skeleton-summary" />
      </div>
      <div className="skeleton integralizacao-skeleton-glossary" />
      <div className="skeleton integralizacao-skeleton-table" />
    </div>
  );
}
