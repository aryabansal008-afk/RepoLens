import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import usePageTitle from '../../hooks/usePageTitle';
import {
  BLOG_CATEGORIES,
  bundledPosts,
  deleteDraft,
  draftToSeed,
  exportDraftMarkdown,
  importDraftText,
  listDrafts,
  saveDraft,
} from '../../services/blogApi';
import { slugify } from '../../utils/slugify';

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: BLOG_CATEGORIES[0],
  tags: '',
  featured: false,
  author: 'RepoLens',
  source: 'new',
};

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BlogEditor() {
  usePageTitle('Local drafts');
  const { slug } = useParams();
  const navigate = useNavigate();
  const creating = !slug;
  const [drafts, setDrafts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(false);

  useEffect(() => {
    setDrafts(listDrafts());
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setForm(EMPTY);
      setSlugTouched(false);
      return;
    }
    const draft = listDrafts().find((item) => item.slug === slug);
    if (draft) {
      setForm({
        ...draft,
        tags: (draft.tags || []).join(', '),
        source: 'browser',
      });
      setSlugTouched(true);
      return;
    }
    const published = bundledPosts().find((item) => item.slug === slug);
    if (!published) return;
    setForm({
      ...published,
      tags: (published.tags || []).join(', '),
      source: 'bundled',
    });
    setSlugTouched(true);
  }, [slug]);

  function update(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  }

  function onSave(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const saved = saveDraft({
        ...form,
        tags: form.tags,
        slug: slugify(form.slug || form.title),
      });
      setDrafts(listDrafts());
      setMessage('Saved as a local draft in this browser. It is not on the published site.');
      navigate(`/admin/blog/${saved.slug}/edit`);
    } catch (err) {
      setError(err.message);
    }
  }

  function confirmDelete() {
    setError('');
    try {
      deleteDraft(slugify(form.slug || form.title));
      setPendingDelete(false);
      setDrafts(listDrafts());
      setMessage('Local draft removed from this browser.');
      navigate('/admin/blog');
    } catch (err) {
      setError(err.message);
    }
  }

  function exportCurrent(kind) {
    setError('');
    try {
      const draft = saveDraft({
        ...form,
        tags: form.tags,
        slug: slugify(form.slug || form.title),
      });
      setDrafts(listDrafts());
      if (kind === 'json') {
        download(`${draft.slug}.json`, `${JSON.stringify(draftToSeed(draft), null, 2)}\n`, 'application/json');
      } else {
        download(`${draft.slug}.md`, exportDraftMarkdown(draft), 'text/markdown');
      }
      setMessage('File downloaded. Add it to src/data/blogSeed.js and rebuild to publish it. The download itself does not change the site.');
      navigate(`/admin/blog/${draft.slug}/edit`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onImport(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const text = await file.text();
      const saved = importDraftText(text);
      setDrafts(listDrafts());
      setMessage(`Imported ${saved.length} local draft${saved.length === 1 ? '' : 's'}. They stay in this browser until you add them to the site bundle.`);
      if (saved[0]) navigate(`/admin/blog/${saved[0].slug}/edit`);
    } catch (err) {
      setError(err.message || 'That file could not be imported.');
    }
  }

  const publishedMatch = bundledPosts().some((post) => post.slug === slugify(form.slug || ''));
  const isLocal = drafts.some((post) => post.slug === form.slug);

  return (
    <main className="page-shell stack-gap">
      <header className="page-intro">
        <h1 className="page-title">Local drafts</h1>
        <p className="lede">
          Published articles are the files shipped in the site bundle. This page edits drafts in this browser only.
          Export a file and add it to <code>src/data/blogSeed.js</code> before a rebuild if it should appear on the blog.
        </p>
      </header>

      <p className="banner">Local drafts are not published site content. There is no admin sign-in because this page cannot change the public blog.</p>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {message ? <p className="chart-note" role="status">{message}</p> : null}

      <div className="editor-layout">
        <aside className="panel">
          <div className="card-actions">
            <Link className="btn-solid" to="/admin/blog">New draft</Link>
          </div>
          <h2>Local drafts</h2>
          {drafts.length === 0 ? <p className="chart-note">No drafts in this browser.</p> : null}
          <ul className="plain-list">
            {drafts.map((post) => (
              <li key={post.slug}>
                <Link to={`/admin/blog/${post.slug}/edit`}>{post.title}</Link>
                <span>Local draft</span>
              </li>
            ))}
          </ul>
          <h2>Published on the site</h2>
          <ul className="plain-list">
            {bundledPosts().map((post) => (
              <li key={post.slug}>
                <Link to={`/admin/blog/${post.slug}/edit`}>{post.title}</Link>
                <span>Bundled · read on <Link to={`/blog/${post.slug}`}>the blog</Link></span>
              </li>
            ))}
          </ul>
          <label className="btn-ghost">
            Import Markdown or JSON
            <input className="sr-only" type="file" accept=".json,.md,text/markdown,application/json" onChange={onImport} />
          </label>
        </aside>

        <form className="panel editor-form" onSubmit={onSave}>
          {form.source === 'bundled' && !isLocal ? (
            <p className="banner">This copy is the published article. Saving stores a separate local draft and leaves the live article unchanged.</p>
          ) : null}
          {publishedMatch && form.source !== 'bundled' ? (
            <p className="banner">A published article already uses this slug. The local draft does not replace it.</p>
          ) : null}
          <label>
            <span>Title</span>
            <input value={form.title} onChange={(event) => update('title', event.target.value)} required />
          </label>
          <label>
            <span>Slug</span>
            <input
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                update('slug', event.target.value);
              }}
            />
          </label>
          <label>
            <span>Excerpt</span>
            <input value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} />
          </label>
          <label>
            <span>Author</span>
            <input value={form.author} onChange={(event) => update('author', event.target.value)} />
          </label>
          <label>
            <span>Category</span>
            <select value={form.category} onChange={(event) => update('category', event.target.value)}>
              {BLOG_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Tags</span>
            <input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="api, search" />
          </label>
          <label>
            <span>Cover image URL</span>
            <input value={form.coverImage} onChange={(event) => update('coverImage', event.target.value)} placeholder="https://" />
          </label>
          <label className="check-row">
            <input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => update('featured', event.target.checked)} />
            <span>Featured when added to the site bundle</span>
          </label>
          <div className="editor-split">
            <label>
              <span>Markdown</span>
              <textarea value={form.content} onChange={(event) => update('content', event.target.value)} rows={16} />
            </label>
            <div>
              <span className="field-label">Preview</span>
              <div className="article-body preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || '_Nothing to preview yet._'}</ReactMarkdown>
              </div>
            </div>
          </div>
          <div className="card-actions">
            <button className="btn-solid" type="submit">Save local draft</button>
            <button className="btn-ghost" type="button" onClick={() => exportCurrent('json')}>Export JSON</button>
            <button className="btn-ghost" type="button" onClick={() => exportCurrent('md')}>Export Markdown</button>
            {!creating && isLocal ? (
              <button type="button" className="btn-ghost" onClick={() => setPendingDelete(true)}>Delete local draft</button>
            ) : null}
          </div>
        </form>
      </div>

      {pendingDelete ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingDelete(false)}>
          <div className="modal panel" role="dialog" aria-modal="true" aria-labelledby="delete-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="delete-title">Delete this local draft?</h2>
            <p>This removes it from this browser. Published articles in the site bundle stay as they are.</p>
            <div className="card-actions">
              <button type="button" className="btn-solid" onClick={confirmDelete}>Delete draft</button>
              <button type="button" className="btn-ghost" onClick={() => setPendingDelete(false)}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
