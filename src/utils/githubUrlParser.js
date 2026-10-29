const RESERVED = new Set([
  'about',
  'account',
  'apps',
  'collections',
  'codespaces',
  'customer-stories',
  'dashboard',
  'enterprise',
  'events',
  'explore',
  'features',
  'issues',
  'login',
  'logout',
  'marketplace',
  'new',
  'notifications',
  'org',
  'orgs',
  'organizations',
  'pricing',
  'pulls',
  'readme',
  'search',
  'security',
  'settings',
  'signup',
  'site',
  'sponsors',
  'team',
  'topics',
  'trending',
]);

function stripGit(value) {
  return value.replace(/\.git$/i, '');
}

function cleanSegment(value) {
  return decodeURIComponent(value).trim();
}

export function repositoryPath(owner, repo) {
  return `/data-explore/repository/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

export function developerPath(username) {
  return `/data-explore/developer/${encodeURIComponent(username)}`;
}

export function safeHttpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch (error) {
    return null;
  }
}

export function parseGitHubQuery(raw) {
  const input = String(raw || '').trim();
  if (!input) return { kind: 'empty' };

  let url = null;
  if (/^https?:\/\//i.test(input)) {
    try {
      url = new URL(input);
    } catch (error) {
      return { kind: 'invalid', message: 'That does not look like a valid URL.' };
    }
  } else if (/^(www\.)?github\.com\//i.test(input)) {
    try {
      url = new URL(`https://${input}`);
    } catch (error) {
      return { kind: 'invalid', message: 'That does not look like a valid GitHub URL.' };
    }
  }

  if (url) {
    const host = url.hostname.replace(/^www\./i, '');
    if (host !== 'github.com') {
      return { kind: 'invalid', message: 'Only github.com URLs can be opened here.' };
    }
    const parts = url.pathname.split('/').filter(Boolean).map(cleanSegment);
    if (parts.length >= 2 && !RESERVED.has(parts[0].toLowerCase())) {
      return { kind: 'repo', owner: parts[0], repo: stripGit(parts[1]) };
    }
    if (parts.length === 1 && !RESERVED.has(parts[0].toLowerCase())) {
      return { kind: 'user', username: parts[0] };
    }
    return {
      kind: 'invalid',
      message: 'That GitHub URL does not point to a user or repository.',
    };
  }

  const slash = input.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (slash && !input.includes('..')) {
    if (RESERVED.has(slash[1].toLowerCase())) {
      return {
        kind: 'invalid',
        message: 'That path is a GitHub site page, not a repository.',
      };
    }
    return { kind: 'repo', owner: slash[1], repo: stripGit(slash[2]) };
  }

  return { kind: 'ambiguous', query: input };
}
