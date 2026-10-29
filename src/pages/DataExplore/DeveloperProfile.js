import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useDeveloper from '../../hooks/useDeveloper';
import usePageTitle from '../../hooks/usePageTitle';
import StatCard from '../../components/StatCard/StatCard';
import RepositoryCard from '../../components/RepositoryCard/RepositoryCard';
import ContributionHeatmap from '../../components/Charts/ContributionHeatmap';
import LanguageDistribution from '../../components/Charts/LanguageDistribution';
import ErrorState from '../../components/ErrorState/ErrorState';
import EmptyState from '../../components/EmptyState/EmptyState';
import { PageSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { formatFull } from '../../utils/formatNumbers';
import { formatDate, formatRelative } from '../../utils/formatDates';
import { developerLanguages } from '../../utils/chartSeries';
import { repositoryPath, safeHttpUrl } from '../../utils/githubUrlParser';

function eventLabel(event) {
  const name = event.repo?.name;
  switch (event.type) {
    case 'PushEvent':
      return `Pushed ${event.payload?.size || event.payload?.commits?.length || 0} commits${name ? ` to ${name}` : ''}`;
    case 'PullRequestEvent':
      return `${event.payload?.action || 'Updated'} a pull request${name ? ` in ${name}` : ''}`;
    case 'IssuesEvent':
      return `${event.payload?.action || 'Updated'} an issue${name ? ` in ${name}` : ''}`;
    case 'WatchEvent':
      return `Starred ${name || 'a repository'}`;
    case 'ForkEvent':
      return `Forked ${name || 'a repository'}`;
    case 'CreateEvent':
      return `Created ${event.payload?.ref_type || 'something'}${name ? ` in ${name}` : ''}`;
    case 'IssueCommentEvent':
      return `Commented on an issue${name ? ` in ${name}` : ''}`;
    default:
      return `${(event.type || 'Event').replace('Event', '')}${name ? ` · ${name}` : ''}`;
  }
}

export default function DeveloperProfile() {
  const { username } = useParams();
  const [sort, setSort] = useState('stars');
  const result = useDeveloper(username);
  const user = result.user;
  usePageTitle(user ? user.login : 'Developer');

  const languages = useMemo(() => developerLanguages(result.repos), [result.repos]);
  const repos = useMemo(() => {
    const copy = [...result.repos];
    copy.sort((a, b) => (
      sort === 'stars'
        ? (b.stargazers_count || 0) - (a.stargazers_count || 0)
        : new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0)
    ));
    return copy;
  }, [result.repos, sort]);

  if (result.status === 'loading' && !user) return <PageSkeleton />;
  if (result.status === 'error') {
    return (
      <main className="page-shell">
        <ErrorState
          title={result.error.status === 404 ? 'Developer not found' : 'Could not load developer'}
          message={result.error.message}
          onRetry={result.reload}
        />
      </main>
    );
  }

  const website = safeHttpUrl(user.blog);
  const patterns = summarizeCalendar(result.calendar);

  return (
    <main className="page-shell stack-gap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/data-explore">Data Explore</Link>
        <span aria-hidden="true">/</span>
        <span>{user.login}</span>
      </nav>
      <header className="entity-head">
        <img src={user.avatar_url} alt="" width="72" height="72" />
        <div>
          <h1 className="page-title">{user.name || user.login}</h1>
          <p className="lede">@{user.login} · {user.bio || 'No public bio.'}</p>
          <p className="chart-note">
            {[user.company, user.location].filter(Boolean).join(' · ')}
            {website ? <>{user.company || user.location ? ' · ' : ''}<a href={website} target="_blank" rel="noreferrer">Website</a></> : null}
            {(user.company || user.location || website) ? ' · ' : ''}Joined {formatDate(user.created_at)}
          </p>
        </div>
        <a className="btn-ghost" href={user.html_url} target="_blank" rel="noreferrer">View on GitHub</a>
      </header>

      <section className="stat-grid">
        <StatCard label="Followers" value={formatFull(user.followers)} />
        <StatCard label="Following" value={formatFull(user.following)} />
        <StatCard label="Public repositories" value={formatFull(user.public_repos)} />
        <StatCard label="Public gists" value={formatFull(user.public_gists)} />
      </section>

      <ContributionHeatmap result={result.calendar} />
      {patterns ? (
        <section className="panel">
          <h3>Contribution pattern</h3>
          <p>{patterns}</p>
        </section>
      ) : null}

      <LanguageDistribution
        data={languages.map((item) => ({ name: item.name, bytes: item.weight, share: item.share }))}
        loading={false}
        note="Primary language of non-fork public repositories, weighted by stars. This is not a byte-level language mix."
        formatValue={(value) => `${formatFull(value)} star weight`}
      />

      <section className="stack-gap">
        <div className="section-head">
          <div>
            <h2>Public repositories</h2>
            {result.repoNote ? <p>{result.repoNote}</p> : null}
          </div>
          <div className="segmented" role="group" aria-label="Repository sort">
            <button type="button" className={sort === 'stars' ? 'active' : undefined} aria-pressed={sort === 'stars'} onClick={() => setSort('stars')}>Stars</button>
            <button type="button" className={sort === 'updated' ? 'active' : undefined} aria-pressed={sort === 'updated'} onClick={() => setSort('updated')}>Recent activity</button>
          </div>
        </div>
        {repos.length ? (
          <div className="card-grid">
            {repos.slice(0, 12).map((repo) => <RepositoryCard repo={repo} key={repo.id} />)}
          </div>
        ) : (
          <EmptyState title="No public repositories" message="GitHub did not return owner repositories for this account." />
        )}
      </section>

      <section className="panel">
        <h3>Recent public activity</h3>
        <p className="chart-note">The latest public events GitHub returned for this account. This is not a full contribution history.</p>
        {result.eventsError ? <ErrorState message={result.eventsError.message} onRetry={result.reload} /> : null}
        {!result.eventsError && result.events.length === 0 ? (
          <EmptyState title="No recent public events" message="GitHub did not return public events for this account." />
        ) : null}
        <ul className="plain-list">
          {result.events.slice(0, 15).map((event) => {
            const repoName = event.repo?.name || '';
            const [repoOwner, repo] = repoName.split('/');
            return (
              <li key={event.id}>
                <span>{eventLabel(event)}</span>
                <span>
                  {formatRelative(event.created_at)}
                  {repoOwner && repo ? <> · <Link to={repositoryPath(repoOwner, repo)}>Open repository</Link></> : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function summarizeCalendar(result) {
  if (!result?.available || !result.calendar?.weeks) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  result.calendar.weeks.forEach((week) => {
    (week.contributionDays || []).forEach((day) => {
      const index = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      totals[index] += day.contributionCount || 0;
    });
  });
  const best = totals.indexOf(Math.max(...totals));
  if (!totals[best]) return `GitHub reported ${result.calendar.totalContributions} contributions in this calendar, with no counted days.`;
  return `GitHub reported ${result.calendar.totalContributions} contributions in this calendar. ${days[best]} has the highest total in the returned days.`;
}
