import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RepositoryCard from '../../components/RepositoryCard/RepositoryCard';
import ErrorState from '../../components/ErrorState/ErrorState';
import EmptyState from '../../components/EmptyState/EmptyState';
import { CardSkeletonGrid } from '../../components/LoadingSkeleton/LoadingSkeleton';
import { searchRepositories } from '../../services/githubApi';
import { trendingQuery } from '../../utils/chartSeries';
import { formatFull } from '../../utils/formatNumbers';

const WINDOWS = [
  { id: '', label: 'All time' },
  { id: 'today', label: 'Created today' },
  { id: 'week', label: 'Created this week' },
  { id: 'month', label: 'Created this month' },
];

export default function TrendingRepositories() {
  const [params, setParams] = useSearchParams();
  const range = WINDOWS.some((item) => item.id === params.get('range')) ? (params.get('range') || '') : '';
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: 'loading', items: [], total: 0, incomplete: false, error: null });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState((current) => ({
      status: 'loading',
      items: page === 1 ? [] : current.items,
      total: current.total,
      incomplete: current.incomplete,
      error: null,
    }));
    searchRepositories({
      q: range ? trendingQuery(range) : 'stars:>=1000',
      sort: 'stars',
      order: 'desc',
      page,
      perPage: 12,
      signal: controller.signal,
      cache: reloadKey === 0,
    })
      .then((data) => {
        if (cancelled) return;
        setState((current) => {
          const incoming = data.items || [];
          const merged = page === 1
            ? incoming
            : [...current.items, ...incoming.filter((repo) => !current.items.some((item) => item.id === repo.id))];
          return {
            status: 'ready',
            items: merged,
            total: data.total_count || 0,
            incomplete: Boolean(data.incomplete_results),
            error: null,
          };
        });
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        setState((current) => ({ ...current, status: 'error', error }));
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range, page, reloadKey]);

  function selectRange(id) {
    setPage(1);
    const next = new URLSearchParams(params);
    if (id) next.set('range', id);
    else next.delete('range');
    setParams(next);
  }

  const canLoadMore = state.status === 'ready' && state.items.length < Math.min(state.total || 0, 1000) && page < 10;

  return (
    <section className="stack-gap top-starred" aria-labelledby="top-starred-title">
      <div className="section-head">
        <div>
          <h2 id="top-starred-title">Top Starred Repositories</h2>
          <p>
            {range
              ? 'Public repositories created in the selected window, excluding forks, sorted by stars. This is GitHub Search, not official GitHub Trending.'
              : 'Highly starred public repositories from GitHub Search, sorted by stars. This is not GitHub’s official Trending ranking.'}
          </p>
        </div>
        <div className="card-actions">
          <div className="segmented" role="group" aria-label="Creation window">
            {WINDOWS.map((item) => (
              <button
                type="button"
                key={item.label}
                className={range === item.id ? 'active' : undefined}
                aria-pressed={range === item.id}
                onClick={() => selectRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost" onClick={() => { setPage(1); setReloadKey((value) => value + 1); }}>Refresh</button>
        </div>
      </div>
      {state.status === 'loading' && page === 1 ? <CardSkeletonGrid /> : null}
      {state.status === 'error' ? (
        <ErrorState message={state.error.message} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : null}
      {state.items.length ? (
        <>
          <p className="result-count">
            GitHub Search reports {formatFull(state.total)} matching repositories
            {state.incomplete ? ' and marked the count incomplete' : ''}.
            Showing {state.items.length}.
          </p>
          <div className="repo-column">
            {state.items.map((repo) => <RepositoryCard repo={repo} layout="column" key={repo.id} />)}
          </div>
          {canLoadMore ? (
            <button type="button" className="btn-solid" onClick={() => setPage((value) => value + 1)} disabled={state.status === 'loading'}>
              {state.status === 'loading' ? 'Loading…' : 'Load more'}
            </button>
          ) : null}
        </>
      ) : null}
      {state.status === 'ready' && !state.items.length ? (
        <EmptyState title="No repositories" message="GitHub Search did not return repositories for this query." />
      ) : null}
    </section>
  );
}
