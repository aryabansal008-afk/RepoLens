import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartCard from './ChartCard';
import EmptyState from '../EmptyState/EmptyState';
import ErrorState from '../ErrorState/ErrorState';
import { ChartSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { axisTick, gridStroke, tooltipStyle } from './chartTheme';

export default function ContributorChart({ data, loading, error, onRetry }) {
  return (
    <ChartCard
      title="Top contributors"
      note="Contribution counts from GitHub’s contributors endpoint, limited to the first page of 10."
    >
      {loading ? <ChartSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && (!data || data.length === 0) ? (
        <EmptyState title="No contributors listed" message="GitHub did not return contributor totals for this repository." />
      ) : null}
      {!loading && !error && data && data.length > 0 ? (
        <div className="chart-frame chart-frame-tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="login" tick={axisTick} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="contributions" name="Contributions" fill="#e7e7ea" radius={[0, 8, 8, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </ChartCard>
  );
}
