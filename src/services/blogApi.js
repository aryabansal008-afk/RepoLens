import { seedPosts } from '../data/blogSeed';
import { slugify } from '../utils/slugify';

const LOCAL_DRAFTS = 'repolens.localDrafts.v1';
const LEGACY_DRAFTS = 'repolens.localPosts.v1';

export const BLOG_CATEGORIES = [
  'GitHub Analytics',
  'Open Source',
  'Developer Productivity',
  'Repository Insights',
  'Programming Languages',
  'Engineering Tutorials',
];

function readStored(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function readDrafts() {
  const current = readStored(LOCAL_DRAFTS);
  if (current.length || !readStored(LEGACY_DRAFTS).length) return current.map(asDraft);
  const migrated = readStored(LEGACY_DRAFTS).map(asDraft);
  localStorage.setItem(LOCAL_DRAFTS, JSON.stringify(migrated));
  return migrated;
}

function writeDrafts(posts) {
  localStorage.setItem(LOCAL_DRAFTS, JSON.stringify(posts));
}

function asDraft(post) {
  return {
    ...post,
    status: 'draft',
    source: 'browser',
  };
}

export function bundledPosts() {
  return seedPosts
    .filter((post) => post.status === 'published')
    .map((post) => ({ ...post, source: 'bundled' }));
}

function matches(post, query, category) {
  const needle = query.trim().toLowerCase();
  if (category && post.category !== category) return false;
  if (!needle) return true;
  return [post.title, post.excerpt, post.content, ...(post.tags || [])].join(' ').toLowerCase().includes(needle);
}

function sortPosts(posts) {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0)
  );
}

export async function listPosts({ query = '', category = '', page = 1, pageSize = 6 } = {}) {
  const posts = sortPosts(bundledPosts().filter((post) => matches(post, query, category)));
  const total = posts.length;
  const start = (page - 1) * pageSize;
  return {
    posts: posts.slice(start, start + pageSize),
    total,
    mode: 'bundled',
  };
}

export async function getPost(slug) {
  const post = bundledPosts().find((item) => item.slug === slug) || null;
  if (!post) return { post: null, related: [], mode: 'bundled' };
  const related = bundledPosts()
    .filter((item) => item.slug !== post.slug && item.category === post.category)
    .slice(0, 3);
  return { post, related, mode: 'bundled' };
}

export function listDrafts() {
  return sortPosts(readDrafts());
}

function normalizeDraft(input, existing) {
  const title = String(input.title || '').trim();
  const requestedSlug = slugify(input.slug || title);
  if (!title) {
    const error = new Error('A title is required.');
    error.fields = { title: 'A title is required.' };
    throw error;
  }
  if (!requestedSlug) {
    const error = new Error('The slug needs at least one letter or number.');
    error.fields = { slug: 'The slug needs at least one letter or number.' };
    throw error;
  }
  const now = new Date().toISOString();
  return {
    id: existing?.id || input.id || `local-${requestedSlug}`,
    slug: requestedSlug,
    title,
    excerpt: String(input.excerpt || '').trim(),
    content: String(input.content || ''),
    coverImage: String(input.coverImage || '').trim(),
    category: input.category || BLOG_CATEGORIES[0],
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : String(input.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    status: 'draft',
    featured: Boolean(input.featured),
    author: String(input.author || 'RepoLens').trim() || 'RepoLens',
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now,
    publishedAt: null,
    source: 'browser',
  };
}

export function saveDraft(input) {
  const posts = readDrafts();
  const slug = slugify(input.slug || input.title);
  const existing = posts.find((post) => post.slug === slug);
  const next = normalizeDraft(input, existing);
  const without = posts.filter((post) => post.slug !== next.slug);
  without.push(next);
  writeDrafts(without);
  return next;
}

export function deleteDraft(slug) {
  writeDrafts(readDrafts().filter((post) => post.slug !== slug));
}

export function draftToSeed(post) {
  const now = new Date().toISOString();
  return {
    id: post.id && !String(post.id).startsWith('local-') ? post.id : `seed-${post.slug}`,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    category: post.category || BLOG_CATEGORIES[0],
    tags: post.tags || [],
    status: 'published',
    featured: Boolean(post.featured),
    author: post.author || 'RepoLens',
    coverImage: post.coverImage || '',
    createdAt: post.createdAt || now,
    updatedAt: post.updatedAt || now,
    publishedAt: post.updatedAt || now,
    content: post.content || '',
  };
}

export function exportDraftMarkdown(post) {
  const seed = draftToSeed(post);
  const tags = (seed.tags || []).join(', ');
  return `---
title: ${seed.title}
slug: ${seed.slug}
excerpt: ${seed.excerpt}
category: ${seed.category}
tags: ${tags}
author: ${seed.author}
featured: ${seed.featured ? 'true' : 'false'}
coverImage: ${seed.coverImage}
---

${seed.content}
`;
}

function parseFrontMatter(text) {
  const match = String(text || '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  const fields = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const index = line.indexOf(':');
    if (index === -1) return;
    fields[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  });
  return {
    title: fields.title || '',
    slug: fields.slug || '',
    excerpt: fields.excerpt || '',
    category: fields.category || BLOG_CATEGORIES[0],
    tags: fields.tags || '',
    author: fields.author || 'RepoLens',
    featured: fields.featured === 'true',
    coverImage: fields.coverImage || '',
    content: match[2].trim(),
  };
}

export function importDraftText(text) {
  const raw = String(text || '').trim();
  if (!raw) {
    const error = new Error('The file was empty.');
    throw error;
  }
  if (raw.startsWith('{') || raw.startsWith('[')) {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.map((item) => saveDraft(item));
  }
  const markdown = parseFrontMatter(raw);
  if (!markdown) {
    const error = new Error('Import a JSON article or a Markdown file with front matter.');
    throw error;
  }
  return [saveDraft(markdown)];
}
