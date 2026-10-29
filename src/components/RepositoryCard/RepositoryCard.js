import { Link } from 'react-router-dom';
import { formatFull } from '../../utils/formatNumbers';
import { formatRelative } from '../../utils/formatDates';
import { repositoryPath } from '../../utils/githubUrlParser';

export default function RepositoryCard({ repo }) {
  if (!repo?.owner) return null;
  const license = repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION'
    ? repo.license.spdx_id
    : repo.license?.name || 'No license listed';

  return (
    <article className="repo-card panel">
      <div className="repo-card-top">
        <img src={repo.owner.avatar_url} alt="" width="36" height="36" />
        <div>
          <h3>
            <Link to={repositoryPath(repo.owner.login, repo.name)}>{repo.full_name}</Link>
          </h3>
          <p>{repo.description || 'No description provided.'}</p>
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
      <div className="card-actions">
        <a className="btn-ghost" href={repo.html_url} target="_blank" rel="noreferrer">GitHub</a>
        <Link className="btn-solid" to={repositoryPath(repo.owner.login, repo.name)}>Analyze</Link>
      </div>
    </article>
  );
}
