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
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
];

export default function TrendingRepositories() {
  const [params, setParams] = useSearchParams();
  const range = WINDOWS.some((item) => item.id === params.get('range')) ? params.get('range') : 'week';
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    searchRepositories({
      q: trendingQuery(range),
      sort: 'stars',
      perPage: 12,
      signal: controller.signal,
    })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        setState({ status: 'error', data: null, error });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range, reloadKey]);

  function selectRange(id) {
    const next = new URLSearchParams(params);
    next.set('range', id);
    setParams(next);
  }

  const total = state.data?.total_count;

  return (
    <section className="stack-gap" aria-labelledby="trending-title">
      <div className="section-head">
        <div>
          <h2 id="trending-title">Recently popular repositories</h2>
          <p>
            Repositories created in the selected window, excluding forks, sorted by stars.
            This is discovery through GitHub Search, not official GitHub Trending.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Creation window">
          {WINDOWS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={range === item.id ? 'active' : undefined}
              aria-pressed={range === item.id}
              onClick={() => selectRange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {state.status === 'loading' ? <CardSkeletonGrid /> : null}
      {state.status === 'error' ? (
        <ErrorState message={state.error.message} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : null}
      {state.status === 'ready' && state.data?.items?.length ? (
        <>
          <p className="result-count">
            GitHub Search reports {formatFull(total)} matching repositories
            {state.data.incomplete_results ? ' and marked the count incomplete' : ''}.
            Showing {state.data.items.length}.
          </p>
          <div className="card-grid">
            {state.data.items.map((repo) => <RepositoryCard repo={repo} key={repo.id} />)}
          </div>
        </>
      ) : null}
      {state.status === 'ready' && !state.data?.items?.length ? (
        <EmptyState title="No repositories in this window" message="Try a wider creation window." />
      ) : null}
    </section>
  );
}
