import { useEffect, useState } from 'react';
import { searchRepositories, searchUsers } from '../services/githubApi';
import { buildRepositoryQuery } from '../utils/chartSeries';

const REPO_SORTS = new Set(['stars', 'forks', 'updated']);
const USER_SORTS = new Set(['followers', 'repositories', 'joined']);

export default function useGitHubSearch(filters) {
  const { enabled, reloadKey = 0 } = filters;
  const [state, setState] = useState({
    status: 'idle',
    repos: null,
    users: null,
    error: null,
    repoQuery: '',
  });

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', repos: null, users: null, error: null, repoQuery: '' });
      return undefined;
    }
    const controller = new AbortController();
    let cancelled = false;
    const type = filters.type || 'repositories';
    const repoQuery = buildRepositoryQuery(filters);
    const userQuery = String(filters.q || '').trim();
    const page = Number(filters.page) || 1;
    setState((current) => ({ ...current, status: 'loading', error: null, repoQuery }));

    const tasks = [];
    if (type !== 'users' && repoQuery) {
      const sort = REPO_SORTS.has(filters.sort) ? filters.sort : '';
      tasks.push(
        searchRepositories({ q: repoQuery, sort, page, perPage: 10, signal: controller.signal }).then((data) => ({
          kind: 'repos',
          data,
        }))
      );
    }
    if (type !== 'repositories' && userQuery) {
      const sort = USER_SORTS.has(filters.sort) ? filters.sort : '';
      tasks.push(
        searchUsers({ q: userQuery, sort, page, perPage: 10, signal: controller.signal }).then((data) => ({
          kind: 'users',
          data,
        }))
      );
    }

    if (!tasks.length) {
      setState({
        status: 'ready',
        repos: null,
        users: null,
        error: null,
        repoQuery,
        emptyReason: type === 'users'
          ? 'Enter a name or username to search developers.'
          : 'Add a keyword or at least one repository filter.',
      });
      return () => controller.abort();
    }

    Promise.all(tasks)
      .then((results) => {
        if (cancelled) return;
        const next = { status: 'ready', repos: null, users: null, error: null, repoQuery, emptyReason: '' };
        results.forEach((result) => {
          next[result.kind] = result.data;
        });
        setState(next);
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        setState({ status: 'error', repos: null, users: null, error, repoQuery });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filters, enabled, reloadKey]);

  return state;
}
