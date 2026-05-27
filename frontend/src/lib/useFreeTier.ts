import { useState, useCallback } from 'react';

const STORAGE_KEY = 'lyrica_free_tier_count';
const MAX_FREE_GENERATIONS = 5;

export function useFreeTier() {
  const [count, setCount] = useState(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    } catch {
      return 0;
    }
  });

  const remaining = Math.max(0, MAX_FREE_GENERATIONS - count);
  const isLocked = count >= MAX_FREE_GENERATIONS;

  const incrementGeneration = useCallback(() => {
    const next = count + 1;
    setCount(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
  }, [count]);

  const resetCount = useCallback(() => {
    setCount(0);
    try {
      localStorage.setItem(STORAGE_KEY, '0');
    } catch {}
  }, []);

  return { count, remaining, isLocked, incrementGeneration, resetCount, MAX_FREE_GENERATIONS };
}
