import { useEffect, useState } from 'react';
import {
  getCodeFrequency,
  getCommitActivity,
  getCommits,
  getContributors,
  getIssues,
  getParticipation,
  getPulls,
  getReleases,
  getRepoLanguages,
  getRepository,
  getStarSample,
} from '../services/githubApi';

const EMPTY = {
  languages: null,
  commitActivity: null,
  codeFrequency: null,
  participation: null,
  contributors: null,
  commits: null,
  pulls: null,
  issues: null,
  releases: null,
  stars: null,
};

function sectionLoading() {
  return {
    languages: { status: 'loading', data: null, error: null },
    commitActivity: { status: 'loading', data: null, error: null },
    codeFrequency: { status: 'loading', data: null, error: null },
    participation: { status: 'loading', data: null, error: null },
    contributors: { status: 'loading', data: null, error: null },
    commits: { status: 'loading', data: null, error: null },
    pulls: { status: 'loading', data: null, error: null },
    issues: { status: 'loading', data: null, error: null },
    releases: { status: 'loading', data: null, error: null },
    stars: { status: 'loading', data: null, error: null },
  };
}

export default function useRepository(owner, repo) {
  const [reloadKey, setReloadKey] = useState(0);
  const [repoState, setRepoState] = useState({ status: 'loading', data: null, error: null });
  const [sections, setSections] = useState(sectionLoading);

  useEffect(() => {
    if (!owner || !repo) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    setRepoState({ status: 'loading', data: null, error: null });
    setSections(sectionLoading());

    const settle = (key, promise) => {
      promise
        .then((data) => {
          if (!cancelled) setSections((current) => ({ ...current, [key]: { status: 'ready', data, error: null } }));
        })
        .catch((error) => {
          if (cancelled || error.name === 'AbortError') return;
          setSections((current) => ({ ...current, [key]: { status: 'error', data: null, error } }));
        });
    };

    getRepository(owner, repo, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setRepoState({ status: 'ready', data, error: null });
        const signal = controller.signal;
        settle('languages', getRepoLanguages(owner, repo, signal));
        settle('commitActivity', getCommitActivity(owner, repo, signal));
        settle('codeFrequency', getCodeFrequency(owner, repo, signal));
        settle('participation', getParticipation(owner, repo, signal));
        settle('contributors', getContributors(owner, repo, signal));
        settle('commits', getCommits(owner, repo, signal));
        settle('pulls', getPulls(owner, repo, signal));
        settle('issues', getIssues(owner, repo, signal));
        settle('releases', getReleases(owner, repo, signal));
        settle('stars', getStarSample(owner, repo, data.stargazers_count || 0, signal));
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        setRepoState({ status: 'error', data: null, error });
        setSections((current) => {
          const next = { ...current };
          Object.keys(EMPTY).forEach((key) => {
            next[key] = { status: 'error', data: null, error };
          });
          return next;
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [owner, repo, reloadKey]);

  return {
    repoState,
    sections,
    reload: () => setReloadKey((value) => value + 1),
  };
}
