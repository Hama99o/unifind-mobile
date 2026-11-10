/**
 * Drops every per-user React Query entry (keys starting with "user", see
 * useAsyncResource / qk.user) when the session ends, so nothing from the last
 * account stays in memory or flashes for the next one.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

export function useClearUserCacheOnLogout() {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.isLoggedIn && !state.isLoggedIn) {
          queryClient.removeQueries({ queryKey: ["user"] });
        }
      }),
    [queryClient]
  );
}
