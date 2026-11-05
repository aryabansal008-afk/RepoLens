import { useState } from 'react';
import { Link } from 'react-router-dom';
import useLocalList, { publishLists } from '../hooks/useLocalList';
import {
  STORAGE_KEYS,
  addCompare,
  bookmarkFromRepo,
  isRepoRef,
  removeCompare,
  sameRepo,
  toggleBookmark,
} from '../utils/localLists';

export function BookmarkButton({ repo }) {
  const bookmarks = useLocalList(STORAGE_KEYS.bookmarks, isRepoRef);
  if (!repo?.owner) return null;
  const record = bookmarkFromRepo(repo);
  const saved = bookmarks.some((item) => sameRepo(item, record));

  function onClick() {
    toggleBookmark(window.localStorage, record);
    publishLists();
  }

  return (
    <button type="button" className="btn-ghost" aria-pressed={saved} onClick={onClick}>
      {saved ? 'Bookmarked' : 'Bookmark'}
    </button>
  );
}

export function CompareButton({ owner, repo, fullName }) {
  const items = useLocalList(STORAGE_KEYS.compare, isRepoRef);
  const [message, setMessage] = useState('');
  const selected = items.some((item) => sameRepo(item, { owner, repo }));

  function onClick() {
    if (selected) {
      removeCompare(window.localStorage, { owner, repo });
      setMessage('');
    } else {
      const result = addCompare(window.localStorage, { owner, repo, fullName });
      setMessage(result.message);
    }
    publishLists();
  }

  return (
    <>
      <button type="button" className="btn-ghost" aria-pressed={selected} onClick={onClick}>
        {selected ? 'In comparison' : 'Compare'}
      </button>
      {selected ? <Link className="btn-ghost" to="/compare">Open comparison</Link> : null}
      {message ? <p className="form-error" role="status">{message}</p> : null}
    </>
  );
}
