export const STORAGE_KEYS = {
  bookmarks: 'repolens.bookmarks',
  searches: 'repolens.searches',
  recent: 'repolens.recentRepos',
};

export function sameRepo(left, right) {
  return left?.owner?.toLowerCase() === right?.owner?.toLowerCase()
    && left?.repo?.toLowerCase() === right?.repo?.toLowerCase();
}

export function isRepoRef(item) {
  return Boolean(item && typeof item.owner === 'string' && item.owner && typeof item.repo === 'string' && item.repo);
}

export function isSearchEntry(item) {
  return Boolean(item && typeof item.query === 'string' && item.query && typeof item.mode === 'string');
}

export function readJsonList(storage, key, guard) {
  try {
    const parsed = JSON.parse(storage.getItem(key) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(guard);
  } catch (error) {
    return [];
  }
}

export function writeJsonList(storage, key, items) {
  storage.setItem(key, JSON.stringify(items));
}

export function bookmarkFromRepo(repo) {
  return {
    owner: repo.owner.login,
    repo: repo.name,
    fullName: repo.full_name,
    description: repo.description || '',
    language: repo.language || '',
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updated: repo.pushed_at || repo.updated_at || '',
    htmlUrl: repo.html_url || '',
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 8) : [],
  };
}

export function toggleBookmark(storage, repo) {
  const current = readJsonList(storage, STORAGE_KEYS.bookmarks, isRepoRef);
  const exists = current.some((item) => sameRepo(item, repo));
  const next = exists
    ? current.filter((item) => !sameRepo(item, repo))
    : [{ ...repo, savedAt: new Date().toISOString() }, ...current].slice(0, 50);
  writeJsonList(storage, STORAGE_KEYS.bookmarks, next);
  return { items: next, saved: !exists };
}

export function rememberSearch(storage, query, mode) {
  const entry = { query, mode, at: new Date().toISOString() };
  const current = readJsonList(storage, STORAGE_KEYS.searches, isSearchEntry)
    .filter((item) => item.query.toLowerCase() !== query.toLowerCase() || item.mode !== mode);
  writeJsonList(storage, STORAGE_KEYS.searches, [entry, ...current].slice(0, 8));
}

export function rememberRecent(storage, repo) {
  const current = readJsonList(storage, STORAGE_KEYS.recent, isRepoRef)
    .filter((item) => !sameRepo(item, repo));
  writeJsonList(storage, STORAGE_KEYS.recent, [{ ...repo, viewedAt: new Date().toISOString() }, ...current].slice(0, 8));
}

export function clearList(storage, key) {
  writeJsonList(storage, key, []);
}
