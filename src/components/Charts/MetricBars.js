import { useMemo, useRef, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import { axisTick, tooltipStyle } from './chartTheme';

const LABEL_FONT = `${axisTick.fontSize}px ${axisTick.fontFamily}`;
const Y_AXIS_WIDTH = 48;

function textWidth(text) {
  if (typeof document === 'undefined') return String(text).length * 7.2;
  const canvas = textWidth.canvas || (textWidth.canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d');
  context.font = LABEL_FONT;
  return context.measureText(String(text)).width;
}

function truncateToWidth(text, maxWidth) {
  const full = String(text);
  if (maxWidth <= 0 || textWidth(full) <= maxWidth) return full;
  const ellipsis = '…';
  let low = 0;
  let high = full.length;
  let best = '';
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = mid === 0 ? ellipsis : `${full.slice(0, mid)}${ellipsis}`;
    if (textWidth(candidate) <= maxWidth) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}

function axisLayout(labels, frameWidth) {
  const width = frameWidth > 0 ? frameWidth : 420;
  const plotWidth = Math.max(0, width - Y_AXIS_WIDTH - 16);
  const available = Math.max(0, plotWidth / Math.max(labels.length, 1) - 10);
  const widest = labels.reduce((max, label) => Math.max(max, textWidth(label)), 0);
  if (widest <= available) return { mode: 'full', maxWidth: available, height: 32 };
  const shortLabels = labels.every((label) => String(label).length <= 5);
  if (shortLabels) return { mode: 'angled', maxWidth: available, height: Math.min(72, Math.ceil(widest * 0.7) + 12) };
  if (available < textWidth('A…')) return { mode: 'hidden', maxWidth: 0, height: 8 };
  return { mode: 'truncate', maxWidth: available, height: 32 };
}

function AxisNameTick({ x = 0, y = 0, payload, mode, maxWidth }) {
  const full = String(payload?.value ?? '');
  if (mode === 'hidden') return null;
  const shown = mode === 'truncate' ? truncateToWidth(full, maxWidth) : full;
  if (!shown) return null;
  const angled = mode === 'angled';
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text
        dy={angled ? 0 : 14}
        dx={angled ? -4 : 0}
        textAnchor={angled ? 'end' : 'middle'}
        transform={angled ? 'rotate(-40)' : undefined}
        fill={axisTick.fill}
        fontSize={axisTick.fontSize}
        fontFamily={axisTick.fontFamily}
      >
        {shown}
      </text>
    </g>
  );
}

function MetricTooltip({ active, payload, label, yLabel }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...tooltipStyle, padding: '8px 12px', maxWidth: 280 }}>
      <div style={{ marginBottom: 4, wordBreak: 'break-word' }}>{label}</div>
      <div>{yLabel}: {payload[0].value}</div>
    </div>
  );
}

export default function MetricBars({ title, note, data, xKey, yKey, yLabel }) {
  const observerRef = useRef(null);
  const [frameWidth, setFrameWidth] = useState(0);

  const frameRef = (node) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;
    const update = () => {
      const next = node.clientWidth;
      setFrameWidth((current) => (current === next ? current : next));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    observerRef.current = observer;
  };

  const labels = useMemo(
    () => (data || []).map((row) => String(row?.[xKey] ?? '')),
    [data, xKey]
  );
  const layout = useMemo(() => axisLayout(labels, frameWidth), [labels, frameWidth]);
  const chartNote = layout.mode === 'truncate' || layout.mode === 'hidden'
    ? [note, 'Hover a bar to see the full name.'].filter(Boolean).join(' ')
    : note;

  if (!data?.length) return null;

  return (
    <ChartCard title={title} note={chartNote}>
      <div className="chart-frame" role="img" aria-label={title} ref={frameRef}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: layout.mode === 'hidden' ? 0 : 4 }}>
            <XAxis
              dataKey={xKey}
              interval={0}
              minTickGap={0}
              tick={(props) => <AxisNameTick {...props} mode={layout.mode} maxWidth={layout.maxWidth} />}
              height={layout.height}
            />
            <YAxis tick={axisTick} allowDecimals={false} width={Y_AXIS_WIDTH} />
            <Tooltip
              content={<MetricTooltip yLabel={yLabel} />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.06)' }}
            />
            <Bar dataKey={yKey} fill="#e7e7ea" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
