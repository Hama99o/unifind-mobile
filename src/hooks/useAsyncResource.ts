/**
 * useAsyncResource — generic async loader hook.
 *
 * Runs `loader` on mount and whenever `deps` change.
 * Returns { data, loading, error, reload }.
 * Sets error to the loader's thrown message (caller passes the i18n string).
 *
 * Usage:
 *   const { data, loading, error, reload } = useAsyncResource(
 *     () => myApi.fetchData(),
 *     [userId, locale]
 *   );
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): AsyncResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable ref to the loader so the callback doesn't stale-close over it.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  // Increment to trigger a reload without re-creating the effect.
  const [reloadCount, setReloadCount] = useState(0);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      setData(result);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [reloadCount, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run]);

  const reload = useCallback(() => {
    setReloadCount((n) => n + 1);
  }, []);

  return { data, loading, error, reload };
}
