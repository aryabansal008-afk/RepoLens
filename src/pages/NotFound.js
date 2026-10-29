import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

export default function NotFound() {
  usePageTitle('Not found');
  return (
    <main className="page-shell">
      <h1 className="page-title">Page not found</h1>
      <p className="lede">That address is not part of RepoLens.</p>
      <Link className="btn-solid" to="/">Back home</Link>
    </main>
  );
}
