import { useState, useEffect } from 'react';

/**
 * Hook that syncs a piece of state with localStorage.
 * Usage: const [value, setValue] = usePersistedState('key', initialValue);
 */
export default function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      const toStore = typeof state === 'object' ? JSON.stringify(state) : state;
      localStorage.setItem(key, toStore);
    } catch {
      // ignore storage errors
    }
  }, [key, state]);

  return [state, setState];
}
