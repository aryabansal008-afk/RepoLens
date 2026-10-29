import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdvancedSearch from './AdvancedSearch';
import TrendingRepositories from './TrendingRepositories';
import RepositoryCard from '../../components/RepositoryCard/RepositoryCard';
import DeveloperCard from '../../components/DeveloperCard/DeveloperCard';
import Pagination from '../../components/Pagination';
import ErrorState from '../../components/ErrorState/ErrorState';
import EmptyState from '../../components/EmptyState/EmptyState';
import { CardSkeletonGrid } from '../../components/LoadingSkeleton/LoadingSkeleton';
import useGitHubSearch from '../../hooks/useGitHubSearch';
import usePageTitle from '../../hooks/usePageTitle';
import { formatFull } from '../../utils/formatNumbers';

function hasSearch(params) {
  return ['q', 'language', 'owner', 'stars', 'forks', 'created', 'updated', 'archived', 'topic'].some((key) => params.get(key));
}

export default function DataExplore() {
  usePageTitle('Data Explore');
  const [params, setParams] = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const paramsKey = params.toString();
  const active = hasSearch(params);
  const filters = useMemo(() => {
    const current = new URLSearchParams(paramsKey);
    return {
      enabled: ['q', 'language', 'owner', 'stars', 'forks', 'created', 'updated', 'archived', 'topic'].some((key) => current.get(key)),
      reloadKey,
      q: current.get('q') || '',
      type: current.get('type') || 'repositories',
      language: current.get('language') || '',
      owner: current.get('owner') || '',
      stars: current.get('stars') || '',
      forks: current.get('forks') || '',
      created: current.get('created') || '',
      updated: current.get('updated') || '',
      archived: current.get('archived') || '',
      topic: current.get('topic') || '',
      sort: current.get('sort') || '',
      page: Number(current.get('page') || 1),
    };
  }, [paramsKey, reloadKey]);
  const results = useGitHubSearch(filters);

  function setPage(page) {
    const next = new URLSearchParams(params);
    if (page <= 1) next.delete('page');
    else next.set('page', String(page));
    setParams(next);
  }

  return (
    <main className="page-shell">
      <header className="page-intro">
        <h1 className="page-title">Data Explore</h1>
        <p className="lede">
          Find a repository or developer, or start from repositories that were created recently and collected stars.
        </p>
      </header>
      <AdvancedSearch />
      {active ? (
        <section className="stack-gap">
          <div className="section-head">
            <div>
              <h2>Search results</h2>
              {results.repoQuery ? <p>Repository query <code>{results.repoQuery}</code></p> : null}
            </div>
            <Link to="/data-explore">Back to discovery</Link>
          </div>
          {results.status === 'loading' ? <CardSkeletonGrid /> : null}
          {results.status === 'error' ? (
            <ErrorState message={results.error.message} onRetry={() => setReloadKey((value) => value + 1)} />
          ) : null}
          {results.emptyReason ? <EmptyState title="Add a search term" message={results.emptyReason} /> : null}
          {results.repos ? (
            <div className="stack-gap">
              <p className="result-count">
                {formatFull(results.repos.total_count)} repositories
                {results.repos.incomplete_results ? ' · GitHub marked this count incomplete' : ''}
              </p>
              {results.repos.items?.length ? (
                <div className="card-grid">
                  {results.repos.items.map((repo) => <RepositoryCard repo={repo} key={repo.id} />)}
                </div>
              ) : (
                <EmptyState title="No repositories" message="Try a broader keyword or fewer filters." />
              )}
              <Pagination page={filters.page} total={Math.min(results.repos.total_count || 0, 1000)} pageSize={10} onPage={setPage} />
            </div>
          ) : null}
          {results.users ? (
            <div className="stack-gap">
              <h2>Developers</h2>
              <p className="result-count">{formatFull(results.users.total_count)} users</p>
              {results.users.items?.length ? (
                <div className="card-grid">
                  {results.users.items.map((user) => <DeveloperCard user={user} key={user.login} />)}
                </div>
              ) : (
                <EmptyState title="No developers" message="Try another name or username." />
              )}
              {!results.repos ? (
                <Pagination page={filters.page} total={Math.min(results.users.total_count || 0, 1000)} pageSize={10} onPage={setPage} />
              ) : null}
            </div>
          ) : null}
        </section>
      ) : (
        <TrendingRepositories />
      )}
    </main>
  );
}
