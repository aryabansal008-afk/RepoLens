import { parseGitHubQuery, safeHttpUrl } from './githubUrlParser';

test('keeps a single word ambiguous', () => {
  expect(parseGitHubQuery('react')).toEqual({ kind: 'ambiguous', query: 'react' });
  expect(parseGitHubQuery('torvalds').kind).toBe('ambiguous');
});

test('recognizes owner/repo and repository URLs', () => {
  expect(parseGitHubQuery('facebook/react')).toEqual({ kind: 'repo', owner: 'facebook', repo: 'react' });
  expect(parseGitHubQuery('https://github.com/facebook/react.git')).toMatchObject({
    kind: 'repo',
    owner: 'facebook',
    repo: 'react',
  });
  expect(parseGitHubQuery('https://github.com/facebook/react/pull/10')).toMatchObject({
    owner: 'facebook',
    repo: 'react',
  });
});

test('recognizes a profile URL and rejects other hosts', () => {
  expect(parseGitHubQuery('https://github.com/torvalds')).toEqual({ kind: 'user', username: 'torvalds' });
  expect(parseGitHubQuery('https://example.com/torvalds').kind).toBe('invalid');
  expect(parseGitHubQuery('https://github.com/topics/react').kind).toBe('invalid');
  expect(parseGitHubQuery('').kind).toBe('empty');
});

test('allows only http(s) links', () => {
  expect(safeHttpUrl('javascript:alert(1)')).toBeNull();
  expect(safeHttpUrl('github.com/torvalds')).toBe('https://github.com/torvalds');
});
