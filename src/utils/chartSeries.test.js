import { issueSeries, starSeries, weekdayTotals, weeklyCommits } from './chartSeries';

const now = Date.UTC(2026, 0, 15);

test('filters weekly commits to the selected range', () => {
  const weeks = [
    { week: Date.UTC(2025, 0, 1) / 1000, total: 4, days: [0, 1, 1, 1, 1, 0, 0] },
    { week: Date.UTC(2026, 0, 5) / 1000, total: 9, days: [1, 2, 3, 1, 1, 1, 0] },
  ];
  expect(weeklyCommits(weeks, '30', now)).toEqual([
    expect.objectContaining({ commits: 9 }),
  ]);
  expect(weekdayTotals(weeks, '30', now)[1].commits).toBe(2);
});

test('does not count pull requests as issues', () => {
  const series = issueSeries([
    { created_at: '2026-01-10T00:00:00.000Z', closed_at: null },
    { created_at: '2026-01-10T00:00:00.000Z', pull_request: { url: 'x' } },
  ], '365', now);
  expect(series.issueCount).toBe(1);
  expect(series.points.reduce((sum, point) => sum + point.opened, 0)).toBe(1);
});

test('star history only accumulates supplied timestamps', () => {
  const points = starSeries([
    { starred_at: '2026-01-05T00:00:00.000Z' },
    { starred_at: '2026-01-06T00:00:00.000Z' },
    { starred_at: '2026-01-20T00:00:00.000Z' },
  ]);
  expect(points[points.length - 1].stars).toBe(3);
  expect(points.some((point) => point.stars > 3)).toBe(false);
});
