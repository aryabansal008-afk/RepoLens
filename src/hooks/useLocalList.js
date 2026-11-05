import { useCallback, useEffect, useState } from 'react';
import { readJsonList } from '../utils/localLists';

export default function useLocalList(key, guard) {
  const [items, setItems] = useState(() => readJsonList(window.localStorage, key, guard));

  const refresh = useCallback(() => {
    setItems(readJsonList(window.localStorage, key, guard));
  }, [key, guard]);

  useEffect(() => {
    function onChange() {
      refresh();
    }
    window.addEventListener('storage', onChange);
    window.addEventListener('repolens-storage', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('repolens-storage', onChange);
    };
  }, [refresh]);

  return items;
}

export function publishLists() {
  window.dispatchEvent(new Event('repolens-storage'));
}
