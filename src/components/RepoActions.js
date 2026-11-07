import useLocalList, { publishLists } from '../hooks/useLocalList';
import {
  STORAGE_KEYS,
  bookmarkFromRepo,
  isRepoRef,
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
