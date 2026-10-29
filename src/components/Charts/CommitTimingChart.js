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
import { axisTick, gridStroke, tooltipStyle } from './chartTheme';

function Bars({ data, name }) {
  return (
    <div className="chart-frame">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={gridStroke} vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="commits" name={name} fill="#e7e7ea" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CommitTimingChart({ weekdays, hours, weekdayNote, hourNote }) {
  const weekdayEmpty = !weekdays || weekdays.every((item) => !item.commits);
  const hourEmpty = !hours || hours.every((item) => !item.commits);
  return (
    <div className="stack-gap">
      <ChartCard title="Commits by weekday" note={weekdayNote}>
        {weekdayEmpty ? (
          <EmptyState title="No weekday totals" message="GitHub’s weekly statistic did not include commits in this period." />
        ) : (
          <Bars data={weekdays} name="Commits" />
        )}
      </ChartCard>
      <ChartCard title="Commits by hour" note={hourNote}>
        {hourEmpty ? (
          <EmptyState title="No commits in this sample" message="None of the 100 most recent commits fall in the selected period." />
        ) : (
          <Bars data={hours} name="Commits" />
        )}
      </ChartCard>
    </div>
  );
}
