import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';
import { getPublicEvents } from '../../services/githubApi';
import { formatRelative } from '../../utils/formatDates';
import { developerPath, repositoryPath } from '../../utils/githubUrlParser';
import ErrorState from '../../components/ErrorState/ErrorState';
import { PageSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';
import StatCard from '../../components/StatCard/StatCard';
import { axisTick, gridStroke, tooltipStyle } from '../../components/Charts/chartTheme';
import { formatFull } from '../../utils/formatNumbers';

export default function Events() {
  usePageTitle('Total Events');
  const [page, setPage] = useState(1);
  const [nonce, setNonce] = useState(0);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setStatus('loading');
    getPublicEvents(controller.signal, page)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setEvents((current) => (page === 1 ? list : [...current, ...list]));
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled || err.name === 'AbortError') return;
        setError(err);
        setStatus('error');
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, nonce]);

  const breakdown = useMemo(() => {
    const counts = new Map();
    events.forEach((event) => {
      const type = (event.type || 'Unknown').replace(/Event$/, '');
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  return (
    <main className="page-shell stack-gap">
      <header className="page-intro">
        <h1 className="page-title">Total Events</h1>
        <p className="lede">
          This is a snapshot of the public timeline from GitHub’s Events API.
          The number below counts events in the loaded pages, not every event on GitHub.
        </p>
      </header>
      {status === 'loading' && events.length === 0 ? <PageSkeleton /> : null}
      {status === 'error' && events.length === 0 ? <ErrorState message={error.message} onRetry={() => setPage(1)} /> : null}
      {events.length ? (
        <>
          <section className="stat-grid">
            <StatCard label="Events in this snapshot" value={formatFull(events.length)} hint="Latest public events returned by GitHub." />
            <StatCard label="Event types" value={formatFull(breakdown.length)} />
          </section>
          <section className="chart-card panel">
            <h3>Events by type</h3>
            <p className="chart-note">Counts are limited to the events currently loaded.</p>
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                  <CartesianGrid stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="type" tick={axisTick} interval={0} angle={-30} textAnchor="end" height={70} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Events" fill="#e7e7ea" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
          <ul className="plain-list panel event-list">
            {events.map((event) => {
              const repoName = event.repo?.name || '';
              const [owner, repo] = repoName.split('/');
              return (
                <li key={event.id}>
                  <span>
                    {event.actor?.login ? <Link to={developerPath(event.actor.login)}>{event.actor.login}</Link> : 'Someone'}
                    {' · '}{(event.type || 'Event').replace(/Event$/, '')}
                    {owner && repo ? <> · <Link to={repositoryPath(owner, repo)}>{repoName}</Link></> : null}
                  </span>
                  <span>{formatRelative(event.created_at)}</span>
                </li>
              );
            })}
          </ul>
          <div className="card-actions">
            <button type="button" className="btn-ghost" onClick={() => { setEvents([]); setPage(1); setNonce((value) => value + 1); }} disabled={status === 'loading'}>Refresh</button>
            <button type="button" className="btn-solid" onClick={() => setPage((value) => value + 1)} disabled={status === 'loading' || page >= 3}>
              {status === 'loading' ? 'Loading…' : 'Load another page'}
            </button>
          </div>
          {status === 'error' ? <ErrorState message={error.message} /> : null}
        </>
      ) : null}
    </main>
  );
}
