import { Link } from 'react-router-dom';
import { developerPath } from '../../utils/githubUrlParser';

export default function DeveloperCard({ user }) {
  if (!user) return null;
  const login = user.login;
  return (
    <article className="repo-card panel developer-card">
      <div className="repo-card-top">
        <img src={user.avatar_url} alt="" width="48" height="48" />
        <div>
          <h3><Link to={developerPath(login)}>{login}</Link></h3>
          <p>{user.name || user.type || 'GitHub user'}</p>
        </div>
      </div>
      <div className="card-actions">
        <a className="btn-ghost" href={user.html_url} target="_blank" rel="noreferrer">GitHub</a>
        <Link className="btn-solid" to={developerPath(login)}>View profile</Link>
      </div>
    </article>
  );
}
