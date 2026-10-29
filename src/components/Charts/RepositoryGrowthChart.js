import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

function Frame({ children }) {
  return <div className="chart-frame">{children}</div>;
}

export default function RepositoryGrowthChart({
  codeFrequency,
  participation,
  stars,
  loadingCode,
  loadingParticipation,
  loadingStars,
  errorCode,
  errorParticipation,
  onRetry,
}) {
  return (
    <div className="stack-gap">
      <ChartCard title="Code changes" note="Weekly additions and deletions from GitHub’s code frequency statistic.">
        {loadingCode ? <ChartSkeleton /> : null}
        {!loadingCode && errorCode ? <ErrorState message={errorCode} onRetry={onRetry} /> : null}
        {!loadingCode && !errorCode && (!codeFrequency || codeFrequency.length === 0) ? (
          <EmptyState title="No code frequency" message="GitHub did not return weekly additions and deletions for this period." />
        ) : null}
        {!loadingCode && !errorCode && codeFrequency && codeFrequency.length > 0 ? (
          <Frame>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={codeFrequency} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={48} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                <Area dataKey="additions" name="Additions" stroke="#e7e7ea" fill="rgba(255,255,255,0.12)" />
                <Area dataKey="deletions" name="Deletions" stroke="#c4b8a5" fill="rgba(196,184,165,0.12)" />
              </AreaChart>
            </ResponsiveContainer>
          </Frame>
        ) : null}
      </ChartCard>

      <ChartCard
        title="Participation"
        note="Commit counts from GitHub’s 52-week participation statistic. The last bucket is treated as the current week."
      >
        {loadingParticipation ? <ChartSkeleton /> : null}
        {!loadingParticipation && errorParticipation ? <ErrorState message={errorParticipation} onRetry={onRetry} /> : null}
        {!loadingParticipation && !errorParticipation && (!participation || participation.length === 0) ? (
          <EmptyState title="No participation data" message="GitHub did not return a participation series for this period." />
        ) : null}
        {!loadingParticipation && !errorParticipation && participation && participation.length > 0 ? (
          <Frame>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={participation} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                <Line dataKey="everyone" name="Everyone" stroke="#e7e7ea" dot={false} strokeWidth={2} />
                <Line dataKey="owner" name="Owner" stroke="#c4b8a5" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Frame>
        ) : null}
      </ChartCard>

      <ChartCard
        title="Star history"
        note={stars?.available
          ? 'Cumulative stars from each stargazer timestamp. Shown only when the full list was returned.'
          : 'Historical stars are not estimated.'}
      >
        {loadingStars ? <ChartSkeleton /> : null}
        {!loadingStars && stars && stars.available === false ? (
          <EmptyState title="Star history unavailable" message={stars.reason} />
        ) : null}
        {!loadingStars && stars?.available && (!stars.points || stars.points.length === 0) ? (
          <EmptyState title="No stars yet" message="GitHub reports no stargazers for this repository." />
        ) : null}
        {!loadingStars && stars?.available && stars.points && stars.points.length > 0 ? (
          <Frame>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stars.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area dataKey="stars" name="Stars" stroke="#e7e7ea" fill="rgba(255,255,255,0.14)" />
              </AreaChart>
            </ResponsiveContainer>
          </Frame>
        ) : null}
      </ChartCard>
    </div>
  );
}
