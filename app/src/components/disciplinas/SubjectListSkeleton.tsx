export function SubjectListSkeleton() {
  return (
    <div className="col-12" aria-busy="true" aria-label="Carregando disciplinas">
      <div className="data-table-wrap card">
        <div className="subject-list-skeleton">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton subject-list-skeleton-row" />
          ))}
        </div>
      </div>
    </div>
  );
}
