import { Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import useLocalList, { publishLists } from '../../hooks/useLocalList';
import EmptyState from '../../components/EmptyState/EmptyState';
import { formatFull } from '../../utils/formatNumbers';
import { formatRelative } from '../../utils/formatDates';
import { repositoryPath } from '../../utils/githubUrlParser';
import { RepoCardDescription } from '../../components/RepositoryCard/RepositoryCard';
import {
  STORAGE_KEYS,
  clearList,
  isRepoRef,
  isSearchEntry,
  sameRepo,
  toggleBookmark,
} from '../../utils/localLists';
export default function Bookmarks() {
  usePageTitle('Bookmarks');
  const bookmarks = useLocalList(STORAGE_KEYS.bookmarks, isRepoRef);
  const searches = useLocalList(STORAGE_KEYS.searches, isSearchEntry);
  const recent = useLocalList(STORAGE_KEYS.recent, isRepoRef);

  function clear(key) {
    clearList(window.localStorage, key);
    publishLists();
  }

  return (
    <main className="page-shell stack-gap">
      <header className="page-intro">
        <h1 className="page-title">Bookmarks</h1>
        <p className="lede">
          Saved repositories, recent searches, and recently opened repositories stay in this browser.
          Counts on a bookmark are the values saved at that time. Open the repository for live analytics.
        </p>
      </header>

      <section className="stack-gap">
        <div className="section-head">
          <h2>Bookmarked repositories</h2>
          <button type="button" className="btn-ghost" onClick={() => clear(STORAGE_KEYS.bookmarks)} disabled={!bookmarks.length}>Clear bookmarks</button>
        </div>
        {bookmarks.length ? (
          <div className="card-grid">
            {bookmarks.map((item) => (
              <article className="repo-card panel" key={`${item.owner}/${item.repo}`}>
                <h3><Link to={repositoryPath(item.owner, item.repo)} title={item.fullName || `${item.owner}/${item.repo}`}>{item.fullName || `${item.owner}/${item.repo}`}</Link></h3>
                <RepoCardDescription text={item.description || 'No description was saved.'} />
                <dl className="meta-list">
                  <div><dt>Language</dt><dd>{item.language || '—'}</dd></div>
                  <div><dt>Stars when saved</dt><dd>{formatFull(item.stars)}</dd></div>
                  <div><dt>Forks when saved</dt><dd>{formatFull(item.forks)}</dd></div>
                  <div><dt>Updated when saved</dt><dd>{formatRelative(item.updated)}</dd></div>
                </dl>
                {item.topics?.length ? (
                  <div className="topic-row">
                    {item.topics.map((topic) => <span className="chip" key={topic}>{topic}</span>)}
                  </div>
                ) : null}
                <div className="card-actions">
                  <Link className="btn-solid" to={repositoryPath(item.owner, item.repo)}>Details</Link>
                  {item.htmlUrl ? <a className="btn-ghost" href={item.htmlUrl} target="_blank" rel="noopener noreferrer">GitHub</a> : null}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      toggleBookmark(window.localStorage, item);
                      publishLists();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No bookmarks" message="Use Bookmark on a repository card. Nothing is stored on a server." />
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Recent searches</h2>
          <button type="button" className="btn-ghost" onClick={() => clear(STORAGE_KEYS.searches)} disabled={!searches.length}>Clear searches</button>
        </div>
        {searches.length ? (
          <ul className="plain-list">
            {searches.map((item) => (
              <li key={`${item.mode}-${item.query}`}>
                <span>{item.query}</span>
                <span>{item.mode}</span>
              </li>
            ))}
          </ul>
        ) : <p className="chart-note">Searches you submit from the home search bar appear here.</p>}
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Recently viewed</h2>
          <button type="button" className="btn-ghost" onClick={() => clear(STORAGE_KEYS.recent)} disabled={!recent.length}>Clear history</button>
        </div>
        {recent.length ? (
          <ul className="plain-list">
            {recent.map((item) => (
              <li key={`${item.owner}/${item.repo}`}>
                <Link to={repositoryPath(item.owner, item.repo)}>{item.fullName || `${item.owner}/${item.repo}`}</Link>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    const next = recent.filter((entry) => !sameRepo(entry, item));
                    window.localStorage.setItem(STORAGE_KEYS.recent, JSON.stringify(next));
                    publishLists();
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="chart-note">Opening a repository details page adds it to this list.</p>}
      </section>
    </main>
  );
}
