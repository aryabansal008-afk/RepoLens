import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import useLocalList, { publishLists } from '../../hooks/useLocalList';
import MetricBars from '../../components/Charts/MetricBars';
import ErrorState from '../../components/ErrorState/ErrorState';
import EmptyState from '../../components/EmptyState/EmptyState';
import { getContributors, getRepository } from '../../services/githubApi';
import { formatFull, formatKilobytes } from '../../utils/formatNumbers';
import { formatDate, formatRelative } from '../../utils/formatDates';
import { parseGitHubQuery, repositoryPath } from '../../utils/githubUrlParser';
import {
  STORAGE_KEYS,
  addCompare,
  clearList,
  isRepoRef,
  removeCompare,
} from '../../utils/localLists';

function ageLabel(created) {
  const start = new Date(created).getTime();
  if (!created || Number.isNaN(start)) return '—';
  const days = Math.floor((Date.now() - start) / 86400000);
  if (days < 365) return `${Math.max(days, 0)} days`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'}`;
}

export default function Comparison() {
  usePageTitle('Compare repositories');
  const items = useLocalList(STORAGE_KEYS.compare, isRepoRef);
  const [draft, setDraft] = useState('');
  const [formError, setFormError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: 'idle', rows: [] });
  const signature = items.map((item) => `${item.owner}/${item.repo}`).join('|');

  useEffect(() => {
    if (!items.length) {
      setState({ status: 'idle', rows: [] });
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    setState({ status: 'loading', rows: [] });
    Promise.all(items.map(async (item) => {
      try {
        const repo = await getRepository(item.owner, item.repo, controller.signal);
        let contributors = null;
        let contributorNote = '';
        try {
          const list = await getContributors(item.owner, item.repo, controller.signal);
          if (Array.isArray(list)) {
            contributors = list.length;
            contributorNote = list.length >= 10
              ? 'First page only, capped at 10. Not a complete contributor total.'
              : 'Count of people returned on the first contributors page.';
          }
        } catch (error) {
          if (error.name === 'AbortError') throw error;
          contributorNote = error.message;
        }
        return { status: 'ready', repo, contributors, contributorNote };
      } catch (error) {
        if (error.name === 'AbortError') throw error;
        return { status: 'error', item, message: error.message };
      }
    }))
      .then((rows) => {
        if (!cancelled) setState({ status: 'ready', rows });
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        setState({ status: 'error', rows: [], message: error.message });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [signature, reloadKey, items]);

  const ready = state.rows.filter((row) => row.status === 'ready');
  const chartData = useMemo(
    () => ready.map((row) => ({
      name: row.repo.name,
      stars: row.repo.stargazers_count || 0,
      forks: row.repo.forks_count || 0,
      open: row.repo.open_issues_count || 0,
    })),
    [ready]
  );

  function onAdd(event) {
    event.preventDefault();
    const parsed = parseGitHubQuery(draft.trim());
    if (parsed.kind !== 'repo') {
      setFormError('Enter owner/repo or a github.com repository URL.');
      return;
    }
    const result = addCompare(window.localStorage, {
      owner: parsed.owner,
      repo: parsed.repo,
      fullName: `${parsed.owner}/${parsed.repo}`,
    });
    publishLists();
    setFormError(result.ok ? '' : result.message);
    if (result.ok) setDraft('');
  }

  function remove(row) {
    const owner = row.repo?.owner?.login || row.item?.owner;
    const repo = row.repo?.name || row.item?.repo;
    removeCompare(window.localStorage, { owner, repo });
    publishLists();
  }

  const headers = ready.map((row) => row.repo.full_name);

  function cells(read) {
    return ready.map((row) => read(row));
  }

  return (
    <main className="page-shell stack-gap">
      <header className="page-intro">
        <h1 className="page-title">Compare repositories</h1>
        <p className="lede">
          Compare two or three public repositories with live GitHub fields.
          A higher star count is not a measure of code quality.
        </p>
      </header>
      <form className="panel compare-form" onSubmit={onAdd}>
        <label>
          <span>Add a repository</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="owner/repo or GitHub URL"
          />
        </label>
        <button type="submit" className="btn-solid">Add</button>
        {formError ? <p className="form-error" role="alert">{formError}</p> : null}
      </form>
      <div className="card-actions">
        <button type="button" className="btn-ghost" onClick={() => setReloadKey((value) => value + 1)} disabled={!items.length}>Refresh</button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            clearList(window.localStorage, STORAGE_KEYS.compare);
            publishLists();
          }}
          disabled={!items.length}
        >
          Clear comparison
        </button>
      </div>
      {!items.length ? (
        <EmptyState title="Nothing to compare" message="Add repositories here, or use Compare on a repository card or details page. The list stays in this browser." />
      ) : null}
      {state.status === 'loading' ? <p role="status">Loading repository data from GitHub…</p> : null}
      {state.status === 'error' ? <ErrorState message={state.message} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {state.rows.some((row) => row.status === 'error') ? (
        <div className="stack-gap">
          {state.rows.filter((row) => row.status === 'error').map((row) => (
            <ErrorState
              key={`${row.item.owner}/${row.item.repo}`}
              title={`Could not load ${row.item.owner}/${row.item.repo}`}
              message={row.message}
              onRetry={() => setReloadKey((value) => value + 1)}
            />
          ))}
        </div>
      ) : null}
      {ready.length ? (
        <>
          <div className="panel table-scroll">
            <table className="compare-table">
              <caption className="sr-only">Public GitHub metrics for the selected repositories</caption>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  {headers.map((name) => <th scope="col" key={name}>{name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Stars</th>
                  {cells((row) => formatFull(row.repo.stargazers_count)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Forks</th>
                  {cells((row) => formatFull(row.repo.forks_count)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Open issues and pull requests</th>
                  {cells((row) => formatFull(row.repo.open_issues_count)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Subscribers</th>
                  {cells((row) => formatFull(row.repo.subscribers_count)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Primary language</th>
                  {cells((row) => row.repo.language || 'Not reported').map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Created</th>
                  {cells((row) => formatDate(row.repo.created_at)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Age</th>
                  {cells((row) => ageLabel(row.repo.created_at)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Last push</th>
                  {cells((row) => formatRelative(row.repo.pushed_at)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Size</th>
                  {cells((row) => formatKilobytes(row.repo.size)).map((value, index) => <td key={headers[index]}>{value}</td>)}
                </tr>
                <tr>
                  <th scope="row">Contributors returned</th>
                  {ready.map((row) => (
                    <td key={row.repo.full_name}>
                      {row.contributors == null ? 'Unavailable' : formatFull(row.contributors)}
                      <div className="chart-note">{row.contributorNote}</div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Links</th>
                  {ready.map((row) => (
                    <td key={`${row.repo.full_name}-links`}>
                      <Link to={repositoryPath(row.repo.owner.login, row.repo.name)}>Details</Link>
                      {' · '}
                      <button type="button" className="btn-ghost" onClick={() => remove(row)}>Remove</button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="chart-note">
            Open issue counts use GitHub’s open_issues_count field, which includes open pull requests.
            Subscriber counts use subscribers_count. Contributor figures are limited to the first API page.
          </p>
          <div className="split-panels">
            <MetricBars title="Stars" note="Live stargazers_count values. Not a quality ranking." data={chartData} xKey="name" yKey="stars" yLabel="Stars" />
            <MetricBars title="Forks" note="Live forks_count values." data={chartData} xKey="name" yKey="forks" yLabel="Forks" />
            <MetricBars title="Open issues and pull requests" note="Live open_issues_count values." data={chartData} xKey="name" yKey="open" yLabel="Open" />
          </div>
        </>
      ) : null}
    </main>
  );
}
