/**
 * useAsyncResource — per-user server data on React Query.
 *
 * Kept for its simple { data, loading, error, reload } shape, but now cached
 * (QA 2026-11-10 RQ-01): revisiting a profile tab shows the last data at once
 * and refreshes in the background instead of re-showing a skeleton.
 *
 * The key is scoped to the signed-in user automatically, so caches never leak
 * across accounts. `loading` is true only while there is no data yet.
 *
 * Usage:
 *   const { data, loading, error, reload } = useAsyncResource(
 *     ["favorites", "Program", locale],
 *     () => myApi.fetchData()
 *   );
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

export interface AsyncResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const DEFAULT_ERROR = "Failed to load. Please try again.";

export function useAsyncResource<T>(
  key: readonly unknown[],
  loader: () => Promise<T>
): AsyncResourceState<T> {
  const userId = useAuthStore((s) => s.user?.userID);
  const query = useQuery({
    queryKey: ["user", userId ?? "anon", ...key],
    queryFn: loader,
  });

  const { refetch } = query;
  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);

  const error = query.isError
    ? query.error instanceof Error
      ? query.error.message
      : DEFAULT_ERROR
    : null;

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error,
    reload,
  };
}
