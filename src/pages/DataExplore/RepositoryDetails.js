import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import useRepository from '../../hooks/useRepository';
import usePageTitle from '../../hooks/usePageTitle';
import StatCard from '../../components/StatCard/StatCard';
import ErrorState from '../../components/ErrorState/ErrorState';
import EmptyState from '../../components/EmptyState/EmptyState';
import { PageSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import CommitActivityChart from '../../components/Charts/CommitActivityChart';
import CommitTimingChart from '../../components/Charts/CommitTimingChart';
import ContributorChart from '../../components/Charts/ContributorChart';
import PRActivityChart from '../../components/Charts/PRActivityChart';
import IssueActivityChart from '../../components/Charts/IssueActivityChart';
import LanguageDistribution from '../../components/Charts/LanguageDistribution';
import RepositoryGrowthChart from '../../components/Charts/RepositoryGrowthChart';
import { formatFull, formatKilobytes } from '../../utils/formatNumbers';
import { formatDate, formatRelative } from '../../utils/formatDates';
import { developerPath, repositoryPath } from '../../utils/githubUrlParser';
import {
  codeFrequencySeries,
  contributorSeries,
  hourBuckets,
  issueSeries,
  languageSeries,
  participationSeries,
  pullSeries,
  rangeStart,
  starSeries,
  weekdayTotals,
  weeklyCommits,
} from '../../utils/chartSeries';

const TABS = [
  ['overview', 'Overview'],
  ['commits', 'Commits'],
  ['contributors', 'Contributors'],
  ['pull-requests', 'Pull requests'],
  ['issues', 'Issues'],
  ['languages', 'Languages'],
  ['activity', 'Activity'],
];

const RANGES = [
  ['7', '7 days'],
  ['30', '30 days'],
  ['90', '90 days'],
  ['365', '1 year'],
];

function messageOf(section) {
  const message = section?.error?.message || '';
  if (/fewer than 10000 commits/i.test(message)) {
    return 'GitHub does not publish this statistic for repositories with 10,000 or more commits.';
  }
  return message || 'That GitHub request failed.';
}

export default function RepositoryDetails() {
  const { owner, repo } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const range = RANGES.some(([id]) => id === params.get('range')) ? params.get('range') : '365';
  const { repoState, sections, reload } = useRepository(owner, repo);
  const repository = repoState.data;

  usePageTitle(repository ? repository.full_name : 'Repository');

  const weekly = useMemo(() => weeklyCommits(sections.commitActivity.data, range), [sections.commitActivity.data, range]);
  const weekdays = useMemo(() => weekdayTotals(sections.commitActivity.data, range), [sections.commitActivity.data, range]);
  const hours = useMemo(() => hourBuckets(sections.commits.data, range), [sections.commits.data, range]);
  const languages = useMemo(() => languageSeries(sections.languages.data), [sections.languages.data]);
  const contributors = useMemo(() => contributorSeries(sections.contributors.data), [sections.contributors.data]);
  const pulls = useMemo(() => pullSeries(sections.pulls.data, range), [sections.pulls.data, range]);
  const issues = useMemo(() => issueSeries(sections.issues.data, range), [sections.issues.data, range]);
  const codeFrequency = useMemo(() => codeFrequencySeries(sections.codeFrequency.data, range), [sections.codeFrequency.data, range]);
  const participation = useMemo(() => participationSeries(sections.participation.data, range), [sections.participation.data, range]);
  const stars = useMemo(() => {
    const raw = sections.stars.data;
    if (!raw) return null;
    if (raw.available === false) return raw;
    return { available: true, points: starSeries(raw.stargazers) };
  }, [sections.stars.data]);

  if (repoState.status === 'loading') return <PageSkeleton />;
  if (repoState.status === 'error') {
    const missing = repoState.error.status === 404;
    return (
      <main className="page-shell">
        <ErrorState
          title={missing ? 'Repository not found' : 'Could not load repository'}
          message={repoState.error.message}
          onRetry={reload}
        />
      </main>
    );
  }

  const show = (id) => tab === 'overview' || tab === id;
  const recentCommits = (Array.isArray(sections.commits.data) ? sections.commits.data : []).filter((commit) => {
    const iso = commit.commit?.author?.date || commit.commit?.committer?.date;
    return iso && new Date(iso).getTime() >= rangeStart(range);
  }).slice(0, 8);
  const releases = (Array.isArray(sections.releases.data) ? sections.releases.data : []).filter((item) => !item.draft);

  function selectRange(nextRange) {
    const next = new URLSearchParams(params);
    next.set('range', nextRange);
    setParams(next);
  }

  return (
    <main className="page-shell stack-gap">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/data-explore">Data Explore</Link>
        <span aria-hidden="true">/</span>
        <Link to={developerPath(repository.owner.login)}>{repository.owner.login}</Link>
        <span aria-hidden="true">/</span>
        <span>{repository.name}</span>
      </nav>

      <header className="entity-head">
        <img src={repository.owner.avatar_url} alt="" width="64" height="64" />
        <div>
          <h1 className="page-title">{repository.full_name}</h1>
          <p className="lede">{repository.description || 'No description provided.'}</p>
        </div>
        <a className="btn-ghost" href={repository.html_url} target="_blank" rel="noreferrer">View on GitHub</a>
      </header>

      <section className="stat-grid">
        <StatCard label="Stars" value={formatFull(repository.stargazers_count)} />
        <StatCard label="Forks" value={formatFull(repository.forks_count)} />
        <StatCard label="Watchers" value={formatFull(repository.subscribers_count)} hint="Subscriber count. GitHub’s watchers field mirrors stars." />
        <StatCard label="Open issues and PRs" value={formatFull(repository.open_issues_count)} hint="This repository field includes open pull requests." />
        <StatCard label="Size" value={formatKilobytes(repository.size)} />
        <StatCard label="Default branch" value={repository.default_branch || '—'} />
      </section>

      <section className="panel meta-panel">
        <p>Created {formatDate(repository.created_at)} · Last push {formatRelative(repository.pushed_at)}</p>
        <p>License: {repository.license?.spdx_id || 'No license listed'} · Primary language: {repository.language || 'Not reported'}</p>
        {repository.topics?.length ? (
          <div className="chip-row">
            {repository.topics.map((topic) => (
              <Link key={topic} className="chip" to={`/data-explore?topic=${encodeURIComponent(topic)}`}>{topic}</Link>
            ))}
          </div>
        ) : <p>No topics listed.</p>}
      </section>

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Repository sections">
          {TABS.map(([id, label]) => (
            <Link
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'active' : undefined}
              to={`${repositoryPath(owner, repo)}?tab=${id}&range=${range}`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Time range">
          {RANGES.map(([id, label]) => (
            <button key={id} type="button" className={range === id ? 'active' : undefined} aria-pressed={range === id} onClick={() => selectRange(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {show('commits') ? (
        <>
          <CommitActivityChart
            data={weekly}
            loading={sections.commitActivity.status === 'loading'}
            error={sections.commitActivity.status === 'error' ? messageOf(sections.commitActivity) : ''}
            onRetry={reload}
          />
          <CommitTimingChart
            weekdays={weekdays}
            hours={hours.buckets}
            weekdayNote="Weekday totals are summed from GitHub’s weekly commit activity for weeks in the selected period."
            hourNote={`Hour totals use ${hours.inRange} of the ${hours.sampleSize} most recent commits that fall in this period. Hours are shown in your local timezone.`}
          />
        </>
      ) : null}

      {show('contributors') ? (
        <ContributorChart
          data={contributors}
          loading={sections.contributors.status === 'loading'}
          error={sections.contributors.status === 'error' ? messageOf(sections.contributors) : ''}
          onRetry={reload}
        />
      ) : null}

      {show('pull-requests') ? (
        <PRActivityChart
          data={pulls.points}
          loading={sections.pulls.status === 'loading'}
          error={sections.pulls.status === 'error' ? messageOf(sections.pulls) : ''}
          onRetry={reload}
          note={`Opened, merged, and closed-unmerged counts from the ${pulls.sampleSize} most recently updated pull requests. Not a complete history.`}
        />
      ) : null}

      {show('issues') ? (
        <IssueActivityChart
          data={issues.points}
          loading={sections.issues.status === 'loading'}
          error={sections.issues.status === 'error' ? messageOf(sections.issues) : ''}
          onRetry={reload}
          note={`Opened and closed counts from ${issues.issueCount} issues inside the ${issues.sampleSize} most recently updated issue records. Pull requests in that payload are excluded.`}
        />
      ) : null}

      {show('languages') ? (
        <LanguageDistribution
          data={languages}
          loading={sections.languages.status === 'loading'}
          error={sections.languages.status === 'error' ? messageOf(sections.languages) : ''}
          onRetry={reload}
        />
      ) : null}

      {show('activity') ? (
        <RepositoryGrowthChart
          codeFrequency={codeFrequency}
          participation={participation}
          stars={stars}
          loadingCode={sections.codeFrequency.status === 'loading'}
          loadingParticipation={sections.participation.status === 'loading'}
          loadingStars={sections.stars.status === 'loading'}
          errorCode={sections.codeFrequency.status === 'error' ? messageOf(sections.codeFrequency) : ''}
          errorParticipation={sections.participation.status === 'error' ? messageOf(sections.participation) : ''}
          onRetry={reload}
        />
      ) : null}

      {tab === 'overview' || tab === 'activity' ? (
        <section className="split-panels">
          <div className="panel">
            <h3>Recent commits in this period</h3>
            <p className="chart-note">Up to eight commits from the latest 100 that fall in the selected period.</p>
            {sections.commits.status === 'loading' ? <p>Loading commits…</p> : null}
            {sections.commits.status === 'error' ? <ErrorState message={messageOf(sections.commits)} onRetry={reload} /> : null}
            {sections.commits.status === 'ready' && recentCommits.length === 0 ? (
              <EmptyState title="No commits in this period" message="The latest 100 commits are older than the selected range, or the branch has no commits." />
            ) : null}
            <ul className="plain-list">
              {recentCommits.map((commit) => (
                <li key={commit.sha}>
                  <a href={commit.html_url} target="_blank" rel="noreferrer">{commit.commit?.message?.split('\n')[0]}</a>
                  <span>{formatRelative(commit.commit?.author?.date)} · {commit.commit?.author?.name || commit.author?.login || 'Unknown author'}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3>Recent releases</h3>
            <p className="chart-note">The latest releases GitHub returned. Drafts are omitted.</p>
            {sections.releases.status === 'loading' ? <p>Loading releases…</p> : null}
            {sections.releases.status === 'error' ? <ErrorState message={messageOf(sections.releases)} onRetry={reload} /> : null}
            {sections.releases.status === 'ready' && releases.length === 0 ? (
              <EmptyState title="No releases" message="This repository has no published releases in the latest page." />
            ) : null}
            <ul className="plain-list">
              {releases.map((release) => (
                <li key={release.id}>
                  <a href={release.html_url} target="_blank" rel="noreferrer">{release.name || release.tag_name}</a>
                  <span>{formatDate(release.published_at)} · {release.tag_name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
