const DIRECT = 'https://api.github.com';
const memory = new Map();
const listeners = new Set();

let rateLimit = { remaining: null, limit: null, reset: null, limited: false };

export class GitHubError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GitHubError';
    this.status = details.status || 0;
    this.rateLimited = Boolean(details.rateLimited);
  }
}

export function getRateLimit() {
  return rateLimit;
}

export function subscribeRateLimit(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateRateLimit(response) {
  const remaining = response.headers.get('x-ratelimit-remaining');
  if (remaining == null) return;
  rateLimit = {
    remaining: Number(remaining),
    limit: Number(response.headers.get('x-ratelimit-limit')),
    reset: Number(response.headers.get('x-ratelimit-reset')),
    limited: Number(remaining) === 0,
  };
  listeners.forEach((listener) => listener(rateLimit));
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(timer);
      const error = new Error('Aborted');
      error.name = 'AbortError';
      reject(error);
    };
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
}

function cacheKey(path, accept) {
  return `${accept || ''} ${path}`;
}

export async function githubRequest(path, options = {}) {
  const {
    signal,
    accept = 'application/vnd.github+json',
    method = 'GET',
    body,
    retries = 2,
    stats = false,
  } = options;
  const attempts = stats ? 4 : retries;
  let lastError = null;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    let response;
    try {
      response = await fetch(`${DIRECT}${path}`, {
        method,
        signal,
        headers: {
          Accept: accept,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      lastError = error;
      if (attempt < attempts) {
        await wait(400 * (attempt + 1), signal);
        continue;
      }
      throw new GitHubError('The GitHub request could not be completed.');
    }

    updateRateLimit(response);

    if (response.status === 202 && stats) {
      await wait(1200 * (attempt + 1), signal);
      lastError = new GitHubError('GitHub is still computing this statistic. Try again shortly.', {
        status: 202,
      });
      continue;
    }

    if ((response.status === 403 || response.status === 429) && response.headers.get('x-ratelimit-remaining') === '0') {
      const reset = Number(response.headers.get('x-ratelimit-reset'));
      const when = reset ? new Date(reset * 1000).toLocaleTimeString() : 'later';
      throw new GitHubError(
        `GitHub rate limit reached for unauthenticated requests. Requests can resume around ${when}.`,
        { status: response.status, rateLimited: true }
      );
    }

    if (response.status >= 500 && attempt < attempts) {
      await wait(500 * (attempt + 1), signal);
      continue;
    }

    return response;
  }

  throw lastError || new GitHubError('GitHub did not finish preparing that response.');
}

export async function githubJson(path, options = {}) {
  const ttl = options.ttl ?? 180000;
  const key = cacheKey(path, options.accept);
  if (options.cache !== false) {
    const hit = memory.get(key);
    if (hit && hit.expiry > Date.now()) return hit.value;
  }

  const response = await githubRequest(path, options);
  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new GitHubError('GitHub returned a response that was not JSON.', { status: response.status });
    }
  }

  if (!response.ok) {
    throw new GitHubError(data?.message || `GitHub request failed (${response.status}).`, {
      status: response.status,
    });
  }

  if (options.cache !== false && data != null) {
    memory.set(key, { value: data, expiry: Date.now() + ttl });
  }
  return data;
}

function repoPath(owner, repo, suffix = '') {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${suffix}`;
}

export function searchRepositories({ q, sort, order = 'desc', page = 1, perPage = 10, signal }) {
  const params = new URLSearchParams({
    q,
    order,
    page: String(page),
    per_page: String(perPage),
  });
  if (sort) params.set('sort', sort);
  return githubJson(`/search/repositories?${params.toString()}`, { signal, ttl: 120000 });
}

export function searchUsers({ q, sort, order = 'desc', page = 1, perPage = 10, signal }) {
  const params = new URLSearchParams({
    q,
    order,
    page: String(page),
    per_page: String(perPage),
  });
  if (sort) params.set('sort', sort);
  return githubJson(`/search/users?${params.toString()}`, { signal, ttl: 120000 });
}

export function getRepository(owner, repo, signal) {
  return githubJson(repoPath(owner, repo), { signal });
}

export function getRepoLanguages(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/languages'), { signal, ttl: 600000 });
}

export function getCommitActivity(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/stats/commit_activity'), { signal, stats: true, ttl: 600000 });
}

export function getCodeFrequency(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/stats/code_frequency'), { signal, stats: true, ttl: 600000 });
}

export function getParticipation(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/stats/participation'), { signal, stats: true, ttl: 600000 });
}

export function getContributors(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/contributors?per_page=10'), { signal, ttl: 300000 });
}

export function getCommits(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/commits?per_page=100'), { signal, ttl: 180000 });
}

export function getPulls(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/pulls?state=all&per_page=100&sort=updated&direction=desc'), {
    signal,
    ttl: 180000,
  });
}

export function getIssues(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/issues?state=all&per_page=100&sort=updated&direction=desc'), {
    signal,
    ttl: 180000,
  });
}

export function getReleases(owner, repo, signal) {
  return githubJson(repoPath(owner, repo, '/releases?per_page=10'), { signal, ttl: 300000 });
}

export async function getStarSample(owner, repo, starCount, signal) {
  if (!starCount) return { available: true, stargazers: [] };
  if (starCount > 60) {
    return {
      available: false,
      reason: `GitHub does not provide a star-history summary. This repository has ${starCount.toLocaleString()} stars, and paging through every stargazer would be incomplete within a small request budget.`,
    };
  }
  const pages = Math.ceil(starCount / 30);
  const stargazers = [];
  for (let page = 1; page <= pages; page += 1) {
    const batch = await githubJson(
      repoPath(owner, repo, `/stargazers?per_page=30&page=${page}`),
      { signal, accept: 'application/vnd.github.star+json', ttl: 600000 }
    );
    if (!Array.isArray(batch)) {
      return {
        available: false,
        reason: 'GitHub did not return stargazer timestamps, so cumulative star history cannot be calculated.',
      };
    }
    stargazers.push(...batch);
    if (batch.length < 30) break;
  }
  if (stargazers.length < starCount) {
    return {
      available: false,
      reason: 'The stargazer list was incomplete, so a cumulative chart would undercount stars.',
    };
  }
  return { available: true, stargazers };
}

export function getUser(username, signal) {
  return githubJson(`/users/${encodeURIComponent(username)}`, { signal });
}

export function getUserRepos(username, page, signal) {
  return githubJson(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated&direction=desc&type=owner`,
    { signal, ttl: 180000 }
  );
}

export function getUserEvents(username, signal) {
  return githubJson(`/users/${encodeURIComponent(username)}/events/public?per_page=30`, {
    signal,
    ttl: 60000,
  });
}

export function getPublicEvents(signal, page = 1) {
  return githubJson(`/events?page=${page}`, { signal, ttl: 20000 });
}
