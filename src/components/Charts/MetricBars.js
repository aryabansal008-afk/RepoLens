import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import { axisTick, tooltipStyle } from './chartTheme';

export default function MetricBars({ title, note, data, xKey, yKey, yLabel }) {
  if (!data?.length) return null;
  return (
    <ChartCard title={title} note={note}>
      <div className="chart-frame" role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <XAxis
              dataKey={xKey}
              tick={axisTick}
              interval={0}
              angle={data.length > 6 ? -30 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 64 : 32}
            />
            <YAxis tick={axisTick} allowDecimals={false} width={48} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, yLabel]} />
            <Bar dataKey={yKey} fill="#e7e7ea" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
