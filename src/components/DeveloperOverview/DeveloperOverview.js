import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useDeveloper from '../../hooks/useDeveloper';
import usePageTitle from '../../hooks/usePageTitle';
import StatCard from '../StatCard/StatCard';
import RepositoryCard from '../RepositoryCard/RepositoryCard';
import ContributionHeatmap from '../Charts/ContributionHeatmap';
import LanguageDistribution from '../Charts/LanguageDistribution';
import MetricBars from '../Charts/MetricBars';
import ErrorState from '../ErrorState/ErrorState';
import EmptyState from '../EmptyState/EmptyState';
import { PageSkeleton } from '../LoadingSkeleton/LoadingSkeleton';
import { formatFull } from '../../utils/formatNumbers';
import { formatDate, formatRelative } from '../../utils/formatDates';
import { developerLanguages } from '../../utils/chartSeries';
import { developerPath, repositoryPath, safeHttpUrl } from '../../utils/githubUrlParser';

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

function reposByYear(repos) {
  const totals = new Map();
  repos.forEach((repo) => {
    const year = new Date(repo.created_at).getUTCFullYear();
    if (!year) return;
    totals.set(year, (totals.get(year) || 0) + 1);
  });
  return [...totals.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year: String(year), count }));
}

export default function DeveloperOverview({ username, variant = 'page' }) {
  const [sort, setSort] = useState('stars');
  const [language, setLanguage] = useState('');
  const [kind, setKind] = useState('all');
  const result = useDeveloper(username);
  const user = result.user;
  usePageTitle(user ? user.login : 'Developer');

  const languages = useMemo(() => developerLanguages(result.repos), [result.repos]);
  const filtered = useMemo(() => {
    return result.repos.filter((repo) => {
      if (kind === 'source' && repo.fork) return false;
      if (kind === 'forks' && !repo.fork) return false;
      if (language && (repo.language || '').toLowerCase() !== language.toLowerCase()) return false;
      return true;
    });
  }, [result.repos, language, kind]);
  const repos = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sort === 'forks') return (b.forks_count || 0) - (a.forks_count || 0);
      if (sort === 'updated') return new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0);
      return (b.stargazers_count || 0) - (a.stargazers_count || 0);
    });
    return copy;
  }, [filtered, sort]);
  const starTotal = useMemo(
    () => result.repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
    [result.repos]
  );
  const years = useMemo(() => reposByYear(result.repos), [result.repos]);
  const topStars = useMemo(
    () => [...result.repos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0)).slice(0, 6)
      .map((repo) => ({ name: repo.name, value: repo.stargazers_count || 0 })),
    [result.repos]
  );
  const topForks = useMemo(
    () => [...result.repos].sort((a, b) => (b.forks_count || 0) - (a.forks_count || 0)).slice(0, 6)
      .map((repo) => ({ name: repo.name, value: repo.forks_count || 0 })),
    [result.repos]
  );
  const languageNames = useMemo(() => {
    const names = new Set(result.repos.map((repo) => repo.language).filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [result.repos]);

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
  const Root = variant === 'home' ? 'section' : 'main';
  const Title = variant === 'home' ? 'h2' : 'h1';
  const partial = Boolean(result.repoNote);

  return (
    <Root className={`page-shell stack-gap ${variant === 'home' ? 'dashboard-follow' : ''}`} aria-label={`${user.login} analytics`}>
      {variant === 'page' ? (
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/data-explore">Data Explore</Link>
          <span aria-hidden="true">/</span>
          <span>{user.login}</span>
        </nav>
      ) : null}
      <header className="entity-head">
        <img src={user.avatar_url} alt="" width="72" height="72" />
        <div>
          <Title className="page-title">{user.name || user.login}</Title>
          <p className="lede">@{user.login} · {user.bio || 'No public bio.'}</p>
          <p className="chart-note">
            {[user.company, user.location].filter(Boolean).join(' · ')}
            {website ? <>{user.company || user.location ? ' · ' : ''}<a href={website} target="_blank" rel="noopener noreferrer">Website</a></> : null}
            {(user.company || user.location || website) ? ' · ' : ''}Joined {formatDate(user.created_at)}
          </p>
        </div>
        <div className="card-actions">
          <a className="btn-ghost" href={user.html_url} target="_blank" rel="noopener noreferrer">View on GitHub</a>
          {variant === 'home' ? <Link className="btn-solid" to={developerPath(user.login)}>Full profile</Link> : null}
        </div>
      </header>

      <section className="stat-grid">
        <StatCard label="Followers" value={formatFull(user.followers)} />
        <StatCard label="Following" value={formatFull(user.following)} />
        <StatCard label="Public repositories" value={formatFull(user.public_repos)} />
        <StatCard
          label={partial ? 'Stars in fetched repos' : 'Stars across public repos'}
          value={formatFull(starTotal)}
          hint={partial ? result.repoNote : 'Sum of stargazers_count on the public repositories returned for this account.'}
        />
      </section>

      <ContributionHeatmap result={result.calendar} />

      <LanguageDistribution
        data={languages.map((item) => ({ name: item.name, bytes: item.weight, share: item.share }))}
        loading={false}
        note={partial
          ? `Primary language of non-fork repositories in the fetched set, weighted by stars. ${result.repoNote}`
          : 'Primary language of non-fork public repositories, weighted by stars. This is not a byte-level language mix.'}
        formatValue={(value) => `${formatFull(value)} star weight`}
      />

      <div className="split-panels">
        <MetricBars
          title="Top repositories by stars"
          note={partial ? `Star counts from the ${result.repos.length} repositories fetched, not every public repository.` : 'Star counts from the public repositories GitHub returned.'}
          data={topStars}
          xKey="name"
          yKey="value"
          yLabel="Stars"
        />
        <MetricBars
          title="Top repositories by forks"
          note="Fork counts from the same fetched repository set."
          data={topForks}
          xKey="name"
          yKey="value"
          yLabel="Forks"
        />
      </div>
      <MetricBars
        title="Public repositories by creation year"
        note={partial ? 'Years are counted only for repositories in the fetched set.' : 'Count of public repositories by the year GitHub recorded as created_at.'}
        data={years}
        xKey="year"
        yKey="count"
        yLabel="Repositories"
      />

      <section className="stack-gap">
        <div className="section-head">
          <div>
            <h2>Public repositories</h2>
            {result.repoNote ? <p>{result.repoNote}</p> : null}
          </div>
          <div className="segmented" role="group" aria-label="Repository sort">
            <button type="button" className={sort === 'stars' ? 'active' : undefined} aria-pressed={sort === 'stars'} onClick={() => setSort('stars')}>Stars</button>
            <button type="button" className={sort === 'forks' ? 'active' : undefined} aria-pressed={sort === 'forks'} onClick={() => setSort('forks')}>Forks</button>
            <button type="button" className={sort === 'updated' ? 'active' : undefined} aria-pressed={sort === 'updated'} onClick={() => setSort('updated')}>Updated</button>
          </div>
        </div>
        <div className="filter-grid">
          <label>
            <span>Language</span>
            <select className="language-filter" value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="">All languages</option>
              {languageNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>
            <span>Repository kind</span>
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="all">All fetched</option>
              <option value="source">Sources only</option>
              <option value="forks">Forks only</option>
            </select>
          </label>
        </div>
        {repos.length ? (
          <div className="card-grid">
            {repos.slice(0, 12).map((repo) => <RepositoryCard repo={repo} key={repo.id} />)}
          </div>
        ) : (
          <EmptyState title="No repositories match" message="Adjust the language or kind filters, or GitHub did not return owner repositories for this account." />
        )}
      </section>

      <section className="panel">
        <h3>Recent public activity</h3>
        <p className="chart-note">The latest public events GitHub returned for this account. This is not a full contribution history and it is not GitHub’s contribution calendar.</p>
        {result.eventsError ? <ErrorState message={result.eventsError.message} onRetry={result.reload} /> : null}
        {!result.eventsError && result.events.length === 0 ? (
          <EmptyState title="No recent public events" message="GitHub did not return public events for this account." />
        ) : null}
        <ul className="plain-list">
          {result.events.slice(0, 12).map((event) => {
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
    </Root>
  );
}
