import { PageGrid } from "@/components/layout/PageGrid";

/** Skeleton estruturado da tela de detalhe da disciplina (F25). */
export function SubjectDetailSkeleton() {
  return (
    <PageGrid>
      <div
        className="col-12"
        aria-busy="true"
        aria-label="Carregando disciplina"
      >
        <div className="skeleton subject-detail-skeleton-back" />
      </div>
      <div className="col-12">
        <div className="skeleton subject-detail-skeleton-header" />
      </div>
      <div className="col-12">
        <div className="skeleton subject-detail-skeleton-panel subject-detail-skeleton-panel--sm" />
      </div>
      <div className="col-12 subject-detail-skeleton-row">
        <div className="skeleton subject-detail-skeleton-panel" />
        <div className="skeleton subject-detail-skeleton-panel" />
      </div>
      <div className="col-12">
        <div className="skeleton subject-detail-skeleton-panel subject-detail-skeleton-panel--tasks" />
      </div>
    </PageGrid>
  );
}
