/**
 * useLocalStorage Hook
 *
 * Persists state to localStorage with optional expiration.
 * Used to optionally save last pasted NDJSON for convenience.
 */

import { useState, useEffect, useCallback } from 'react';

interface StoredData<T> {
  value: T;
  timestamp: number;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  expirationMs?: number
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get stored value or initial
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }

      const stored: StoredData<T> = JSON.parse(item);

      // Check expiration
      if (expirationMs && Date.now() - stored.timestamp > expirationMs) {
        localStorage.removeItem(key);
        return initialValue;
      }

      return stored.value;
    } catch {
      return initialValue;
    }
  }, [key, initialValue, expirationMs]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const newValue =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(newValue);

        if (typeof window !== 'undefined') {
          const data: StoredData<T> = {
            value: newValue,
            timestamp: Date.now(),
          };
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Clear stored value
  const clearValue = useCallback(() => {
    setStoredValue(initialValue);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }, [key, initialValue]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const stored: StoredData<T> = JSON.parse(e.newValue);
          setStoredValue(stored.value);
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, clearValue];
}
