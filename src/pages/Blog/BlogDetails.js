import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import usePageTitle from '../../hooks/usePageTitle';
import { getPost } from '../../services/blogApi';
import { formatDate, readingTime } from '../../utils/formatDates';
import { safeHttpUrl } from '../../utils/githubUrlParser';
import ErrorState from '../../components/ErrorState/ErrorState';
import { PageSkeleton } from '../../components/LoadingSkeleton/LoadingSkeleton';

export default function BlogDetails() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading', post: null, related: [] });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', post: null, related: [] });
    getPost(slug)
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', ...result, related: result.related || [] });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', error, post: null, related: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  usePageTitle(state.post?.title || 'Article');
  const cover = safeHttpUrl(state.post?.coverImage);

  if (state.status === 'loading') return <PageSkeleton />;
  if (state.status === 'error') {
    return <main className="page-shell"><ErrorState message={state.error.message} /></main>;
  }
  if (!state.post) {
    return (
      <main className="page-shell">
        <ErrorState title="Article not found" message="That article is not published." />
        <p><Link to="/blog">Back to the blog</Link></p>
      </main>
    );
  }

  const post = state.post;

  return (
    <main className="page-shell article-layout">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/blog">Blog</Link>
        <span aria-hidden="true">/</span>
        <span>{post.title}</span>
      </nav>
      <header>
        <p className="eyebrow">{post.category}</p>
        <h1 className="page-title">{post.title}</h1>
        <p className="chart-note">
          {post.author} · {formatDate(post.publishedAt)} · {readingTime(post.content)} min read
        </p>
      </header>
      {cover ? <img className="article-cover" src={cover} alt="" /> : null}
      <article className="article-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </article>
      {post.tags?.length ? (
        <p className="chip-row">{post.tags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}</p>
      ) : null}
      {state.related?.length ? (
        <section>
          <h2>Related</h2>
          <ul className="plain-list">
            {state.related.map((item) => (
              <li key={item.slug}>
                <Link to={`/blog/${item.slug}`}>{item.title}</Link>
                <span>{item.category}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
