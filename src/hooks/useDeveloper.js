import { useEffect, useState } from 'react';
import { getUser, getUserEvents, getUserRepos } from '../services/githubApi';
import { fetchContributionCalendar } from '../services/githubGraphql';

export default function useDeveloper(username) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    status: 'loading',
    user: null,
    repos: [],
    events: [],
    calendar: null,
    eventsError: null,
    error: null,
    repoNote: '',
  });

  useEffect(() => {
    if (!username) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    setState((current) => ({ ...current, status: 'loading', error: null }));

    getUser(username, controller.signal)
      .then(async (user) => {
        if (cancelled) return;
        setState((current) => ({ ...current, status: 'ready', user, error: null }));
        const pages = user.public_repos > 100 ? [1, 2] : [1];
        const calendarPromise = user.type === 'Organization'
          ? Promise.resolve({
              available: false,
              reason: 'GitHub organizations do not have a personal contribution calendar.',
            })
          : fetchContributionCalendar(username, controller.signal);
        const [repoPages, events, calendar] = await Promise.all([
          Promise.all(pages.map((page) => getUserRepos(username, page, controller.signal))),
          getUserEvents(username, controller.signal).catch((error) => {
            if (error.name === 'AbortError') throw error;
            return { failed: error };
          }),
          calendarPromise,
        ]);
        if (cancelled) return;
        const repos = repoPages.flat().filter((repo) => repo && !repo.message);
        const repoNote = user.public_repos > repos.length
          ? `Showing ${repos.length} of ${user.public_repos} public repositories returned by GitHub. Star sorting applies only to this returned set.`
          : '';
        setState({
          status: 'ready',
          user,
          repos,
          events: Array.isArray(events) ? events : [],
          eventsError: events && events.failed ? events.failed : null,
          calendar,
          error: null,
          repoNote,
        });
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        setState({
          status: 'error',
          user: null,
          repos: [],
          events: [],
          calendar: null,
          eventsError: null,
          error,
          repoNote: '',
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [username, reloadKey]);

  return { ...state, reload: () => setReloadKey((value) => value + 1) };
}
