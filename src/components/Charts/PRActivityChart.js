import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export default function PRActivityChart({ data, loading, error, onRetry, note }) {
  return (
    <ChartCard title="Pull request activity" note={note}>
      {loading ? <ChartSkeleton /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && (!data || data.length === 0) ? (
        <EmptyState title="No pull requests in this period" message="None of the sampled pull requests were opened, merged, or closed in the selected dates." />
      ) : null}
      {!loading && !error && data && data.length > 0 ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#a1a1aa' }} />
              <Bar dataKey="opened" name="Opened" fill="#e7e7ea" radius={[6, 6, 0, 0]} />
              <Bar dataKey="merged" name="Merged" fill="#a1a1aa" radius={[6, 6, 0, 0]} />
              <Bar dataKey="closed" name="Closed unmerged" fill="#c4b8a5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </ChartCard>
  );
}
