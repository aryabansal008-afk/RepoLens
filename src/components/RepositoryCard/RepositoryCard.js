import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatFull } from '../../utils/formatNumbers';
import { formatRelative } from '../../utils/formatDates';
import { repositoryPath } from '../../utils/githubUrlParser';
import { BookmarkButton } from '../RepoActions';

export function RepoCardDescription({ text }) {
  const textRef = useRef(null);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const node = textRef.current;
    if (!node) return undefined;
    const measure = () => setOverflows(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div className={`repo-card-copy${overflows ? ' can-expand' : ''}`}>
      <p ref={textRef} tabIndex={overflows ? 0 : undefined}>{text}</p>
      {overflows ? <p className="repo-card-copy-full" aria-hidden="true">{text}</p> : null}
    </div>
  );
}

export default function RepositoryCard({ repo, layout = 'card' }) {
  if (!repo?.owner) return null;
  const license = repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION'
    ? repo.license.spdx_id
    : repo.license?.name || 'No license listed';

  if (layout === 'column') {
    return (
      <article className="repo-row">
        <div className="repo-row-main">
          <img src={repo.owner.avatar_url} alt="" width="40" height="40" />
          <h3>
            <Link to={repositoryPath(repo.owner.login, repo.name)}>{repo.full_name}</Link>
          </h3>
        </div>
        <p className="repo-row-copy">{repo.description || 'No description provided.'}</p>
        <div className="repo-row-side">
          <div className="repo-row-metrics">
            <div className="repo-metric"><span>Language</span><strong>{repo.language || '—'}</strong></div>
            <div className="repo-metric"><span>Stars</span><strong>{formatFull(repo.stargazers_count)}</strong></div>
            <div className="repo-metric"><span>Forks</span><strong>{formatFull(repo.forks_count)}</strong></div>
            <div className="repo-metric"><span>Updated</span><strong>{formatRelative(repo.pushed_at || repo.updated_at)}</strong></div>
          </div>
          <div className="repo-row-actions">
            <a className="btn-ghost" href={repo.html_url} target="_blank" rel="noopener noreferrer">GitHub</a>
            <Link className="btn-solid" to={repositoryPath(repo.owner.login, repo.name)}>Details</Link>
            <BookmarkButton repo={repo} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="repo-card panel">
      <div className="repo-card-top">
        <img src={repo.owner.avatar_url} alt="" width="36" height="36" />
        <div>
          <h3>
            <Link to={repositoryPath(repo.owner.login, repo.name)} title={repo.full_name}>{repo.full_name}</Link>
          </h3>
          <RepoCardDescription text={repo.description || 'No description provided.'} />
        </div>
      </div>
      <dl className="meta-list">
        <div><dt>Language</dt><dd>{repo.language || '—'}</dd></div>
        <div><dt>Stars</dt><dd>{formatFull(repo.stargazers_count)}</dd></div>
        <div><dt>Forks</dt><dd>{formatFull(repo.forks_count)}</dd></div>
        <div><dt title="GitHub includes open pull requests in this field">Open</dt><dd>{formatFull(repo.open_issues_count)}</dd></div>
        <div><dt>Updated</dt><dd>{formatRelative(repo.pushed_at || repo.updated_at)}</dd></div>
        <div><dt>License</dt><dd>{license}</dd></div>
      </dl>
      {repo.topics?.length ? (
        <div className="topic-row">
          {repo.topics.slice(0, 6).map((topic) => <span className="chip" key={topic}>{topic}</span>)}
        </div>
      ) : null}
      <div className="card-actions">
        <a className="btn-ghost" href={repo.html_url} target="_blank" rel="noopener noreferrer">GitHub</a>
        <Link className="btn-solid" to={repositoryPath(repo.owner.login, repo.name)}>Details</Link>
        <BookmarkButton repo={repo} />
      </div>
    </article>
  );
}
