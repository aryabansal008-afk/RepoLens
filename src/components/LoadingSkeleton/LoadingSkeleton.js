export function PageSkeleton() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Loading">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return <div className="skeleton skeleton-chart" aria-hidden="true" />;
}

export function CardSkeletonGrid() {
  return (
    <div className="card-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <div className="skeleton skeleton-card" key={index} />)}
    </div>
  );
}
