import ChartCard from './ChartCard';
import EmptyState from '../EmptyState/EmptyState';

export default function ContributionHeatmap({ result }) {
  const available = result?.available && result.calendar;
  const weeks = available ? result.calendar.weeks || [] : [];
  const counts = weeks.flatMap((week) => (week.contributionDays || []).map((day) => day.contributionCount || 0));
  const max = Math.max(1, ...counts);

  return (
    <ChartCard
      title="Contribution calendar"
      note={available
        ? `GitHub reports ${result.calendar.totalContributions} contributions for the calendar it returned. Shades use those counts.`
        : 'Unavailable without an authenticated GitHub GraphQL request. RepoLens does not send a token from the browser.'}
    >
      {!available ? (
        <EmptyState title="Calendar unavailable" message={result?.reason || 'Contribution data was not returned.'} />
      ) : (
        <div className="heatmap-wrap">
          <div className="heatmap" role="img" aria-label={`Contribution calendar with ${result.calendar.totalContributions} contributions`}>
            {weeks.map((week, index) => (
              <div className="heatmap-week" key={week.contributionDays?.[0]?.date || index}>
                {(week.contributionDays || []).map((day) => (
                  <span
                    key={day.date}
                    className="heatmap-day"
                    style={{ background: `rgba(255,255,255,${0.08 + (0.82 * (day.contributionCount || 0)) / max})` }}
                    title={`${day.date}: ${day.contributionCount} contributions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
