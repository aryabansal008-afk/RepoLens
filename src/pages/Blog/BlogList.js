import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { BLOG_CATEGORIES, listPosts } from '../../services/blogApi';
import { formatDate, readingTime } from '../../utils/formatDates';
import { safeHttpUrl } from '../../utils/githubUrlParser';
import ErrorState from '../../components/ErrorState/ErrorState';
import EmptyState from '../../components/EmptyState/EmptyState';
import Pagination from '../../components/Pagination';
import { PageSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';

export default function BlogList() {
  usePageTitle('Blog');
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState({ status: 'loading', posts: [], total: 0, mode: '' });
  const query = params.get('q') || '';
  const category = params.get('category') || '';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, status: 'loading' }));
    listPosts({ query, category, page, pageSize: 6 })
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', ...result });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', posts: [], total: 0, error, mode: '' });
      });
    return () => {
      cancelled = true;
    };
  }, [query, category, page]);

  const featured = page === 1 && !query && !category
    ? state.posts.filter((post) => post.featured)
    : [];
  const latest = state.posts.filter((post) => !featured.some((item) => item.slug === post.slug));

  function update(next) {
    const paramsNext = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) paramsNext.delete(key);
      else paramsNext.set(key, value);
    });
    if (!Object.prototype.hasOwnProperty.call(next, 'page')) paramsNext.delete('page');
    setParams(paramsNext);
  }

  return (
    <main className="page-shell stack-gap">
      <header className="page-intro">
        <h1 className="page-title">Blog</h1>
        <p className="lede">Notes on reading GitHub data carefully. These articles ship with the site. Drafts written in the browser stay off this list.</p>
      </header>
      <form className="blog-tools" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span className="sr-only">Search articles</span>
          <input
            value={query}
            placeholder="Search articles"
            onChange={(event) => update({ q: event.target.value })}
          />
        </label>
        <div className="chip-row" role="group" aria-label="Categories">
          <button type="button" className={`chip ${category === '' ? 'active' : ''}`} onClick={() => update({ category: '' })}>All</button>
          {BLOG_CATEGORIES.map((item) => (
            <button type="button" key={item} className={`chip ${category === item ? 'active' : ''}`} onClick={() => update({ category: item })}>
              {item}
            </button>
          ))}
        </div>
      </form>
      {state.status === 'loading' ? <PageSkeleton /> : null}
      {state.status === 'error' ? <ErrorState message={state.error.message} /> : null}
      {state.status === 'ready' && featured.length ? (
        <section>
          <h2>Featured</h2>
          <div className="card-grid">
            {featured.map((post) => <ArticleCard post={post} key={post.slug} />)}
          </div>
        </section>
      ) : null}
      {state.status === 'ready' ? (
        <section className="stack-gap">
          <h2>Latest</h2>
          {latest.length === 0 && featured.length === 0 ? (
            <EmptyState title="No articles" message="Nothing matches that search yet." />
          ) : (
            <div className="card-grid">
              {latest.map((post) => <ArticleCard post={post} key={post.slug} />)}
            </div>
          )}
          <Pagination
            page={page}
            total={state.total}
            pageSize={6}
            onPage={(nextPage) => update({ page: nextPage > 1 ? String(nextPage) : '', q: query, category })}
          />
        </section>
      ) : null}
    </main>
  );
}

function ArticleCard({ post }) {
  return (
    <article className="repo-card panel">
      {safeHttpUrl(post.coverImage) ? <img className="cover" src={safeHttpUrl(post.coverImage)} alt="" /> : null}
      <p className="eyebrow">{post.category}</p>
      <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
      <p>{post.excerpt}</p>
      <p className="chart-note">{formatDate(post.publishedAt)} · {readingTime(post.content)} min read · {post.author}</p>
    </article>
  );
}
