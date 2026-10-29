export default function ChartCard({ title, note, children }) {
  return (
    <section className="chart-card panel">
      <h3>{title}</h3>
      {note ? <p className="chart-note">{note}</p> : null}
      {children}
    </section>
  );
}
