export default function StatCard({ label, value, hint }) {
  return (
    <article className="stat-card panel">
      <p className="stat-value">{value}</p>
      <h3>{label}</h3>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </article>
  );
}
