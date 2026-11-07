import {
  readJsonList,
  rememberSearch,
  STORAGE_KEYS,
  toggleBookmark,
  isRepoRef,
  isSearchEntry,
} from './localLists';

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
  };
}

test('ignores invalid stored lists', () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEYS.bookmarks, '{"owner":"a"}');
  expect(readJsonList(storage, STORAGE_KEYS.bookmarks, isRepoRef)).toEqual([]);
  storage.setItem(STORAGE_KEYS.bookmarks, '[{"owner":"a","repo":"b"},{"nope":true}]');
  expect(readJsonList(storage, STORAGE_KEYS.bookmarks, isRepoRef)).toEqual([{ owner: 'a', repo: 'b' }]);
});

test('toggles a bookmark without storing a duplicate', () => {
  const storage = memoryStorage();
  const first = toggleBookmark(storage, { owner: 'a', repo: 'one' });
  expect(first.saved).toBe(true);
  const second = toggleBookmark(storage, { owner: 'a', repo: 'one' });
  expect(second.saved).toBe(false);
  expect(second.items).toEqual([]);
});

test('keeps recent searches unique', () => {
  const storage = memoryStorage();
  rememberSearch(storage, 'react', 'search');
  rememberSearch(storage, 'react', 'search');
  rememberSearch(storage, 'torvalds', 'developer');
  const items = readJsonList(storage, STORAGE_KEYS.searches, isSearchEntry);
  expect(items.map((item) => item.query)).toEqual(['torvalds', 'react']);
});
