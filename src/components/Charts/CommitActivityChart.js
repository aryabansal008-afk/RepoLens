import {
  Area,
  AreaChart,
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

export default function CommitActivityChart({ data, loading, error, onRetry, note }) {
  const caption = note || 'Weekly commit totals from GitHub’s commit activity statistic for the selected period.';
  return (
    <ChartCard title="Commit activity" note={caption}>
      {loading ? <ChartSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && (!data || data.length === 0) ? (
        <EmptyState title="No commit weeks" message="GitHub did not return weekly commits in this period." />
      ) : null}
      {!loading && !error && data && data.length > 0 ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="commits" name="Commits" stroke="#e7e7ea" fill="rgba(255,255,255,0.14)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </ChartCard>
  );
}
