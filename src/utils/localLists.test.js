import {
  addCompare,
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

test('toggles bookmarks and caps comparison at three', () => {
  const storage = memoryStorage();
  const first = toggleBookmark(storage, { owner: 'a', repo: 'one' });
  expect(first.saved).toBe(true);
  const second = toggleBookmark(storage, { owner: 'a', repo: 'one' });
  expect(second.saved).toBe(false);
  expect(second.items).toEqual([]);

  addCompare(storage, { owner: 'a', repo: 'one' });
  addCompare(storage, { owner: 'a', repo: 'one' });
  addCompare(storage, { owner: 'a', repo: 'two' });
  addCompare(storage, { owner: 'b', repo: 'three' });
  const blocked = addCompare(storage, { owner: 'c', repo: 'four' });
  expect(blocked.ok).toBe(false);
  expect(blocked.items).toHaveLength(3);
});

test('keeps recent searches unique', () => {
  const storage = memoryStorage();
  rememberSearch(storage, 'react', 'search');
  rememberSearch(storage, 'react', 'search');
  rememberSearch(storage, 'torvalds', 'developer');
  const items = readJsonList(storage, STORAGE_KEYS.searches, isSearchEntry);
  expect(items.map((item) => item.query)).toEqual(['torvalds', 'react']);
});
