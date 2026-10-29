import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import EmptyState from '../EmptyState/EmptyState';
import ErrorState from '../ErrorState/ErrorState';
import { ChartSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { formatBytes } from '../../utils/formatNumbers';
import { languageColor, tooltipStyle } from './chartTheme';

export default function LanguageDistribution({ data, loading, error, onRetry, note, formatValue = formatBytes }) {
  return (
    <ChartCard title="Language distribution" note={note || 'Byte counts from the repository languages endpoint.'}>
      {loading ? <ChartSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && (!data || data.length === 0) ? (
        <EmptyState title="No languages reported" message="GitHub did not list language bytes for this repository." />
      ) : null}
      {!loading && !error && data && data.length > 0 ? (
        <div className="language-chart">
          <div className="chart-frame chart-frame-short">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="bytes" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="rgba(0,0,0,0)">
                  {data.map((entry, index) => (
                    <Cell key={entry.name} fill={languageColor(entry.name, index)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name, item) => [`${formatValue(value)} · ${item.payload.share.toFixed(1)}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="legend-list">
            {data.map((entry, index) => (
              <li key={entry.name}>
                <span className="legend-swatch" style={{ background: languageColor(entry.name, index) }} />
                <span>{entry.name}</span>
                <strong>{entry.share.toFixed(1)}%</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ChartCard>
  );
}
