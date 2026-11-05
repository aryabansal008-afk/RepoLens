import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getReadme } from '../services/githubApi';
import { resolveRepoUrl } from '../utils/githubUrlParser';
import ErrorState from './ErrorState/ErrorState';

export default function ReadmePanel({ owner, repo, branch }) {
  const [state, setState] = useState({ status: 'loading', markdown: '', error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState({ status: 'loading', markdown: '', error: null });
    getReadme(owner, repo, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'ready', markdown: data?.markdown || '', error: null });
      })
      .catch((error) => {
        if (cancelled || error.name === 'AbortError') return;
        if (error.status === 404) {
          setState({ status: 'ready', markdown: '', error: null });
          return;
        }
        setState({ status: 'error', markdown: '', error });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [owner, repo, reloadKey]);

  const blobBase = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/blob/${encodeURIComponent(branch || 'HEAD')}/`;
  const rawBase = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch || 'HEAD')}/`;

  return (
    <section className="panel">
      <h3>README</h3>
      <p className="chart-note">Rendered from the repository README. Relative links and images point at this repository’s default branch.</p>
      {state.status === 'loading' ? <p>Loading README…</p> : null}
      {state.status === 'error' ? <ErrorState message={state.error.message} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {state.status === 'ready' && !state.markdown ? <p>GitHub did not return a README for this repository.</p> : null}
      {state.markdown ? (
        <div className="article-body readme-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const url = resolveRepoUrl(href, blobBase);
                if (!url) return <span>{children}</span>;
                const external = /^https?:/i.test(url);
                return (
                  <a href={url} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    {children}
                  </a>
                );
              },
              img: ({ src, alt }) => {
                const url = resolveRepoUrl(src, rawBase);
                if (!url) return null;
                return <img src={url} alt={alt || ''} />;
              },
            }}
          >
            {state.markdown}
          </ReactMarkdown>
        </div>
      ) : null}
    </section>
  );
}
