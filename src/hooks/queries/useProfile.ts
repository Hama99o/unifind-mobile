/**
 * Profile server state (React Query).
 *
 * useUserInfo — ONE cached GET /userinfo shared by the profile header, Profile
 *   Information and Account Credentials (was fetched separately by each).
 *   After a save, invalidateUserInfo() refreshes all of them (header included).
 * useCountries — static reference list, cached for the session.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/api/profileApi";
import { useAuthStore } from "@/stores/authStore";

export function useUserInfoKey() {
  const userId = useAuthStore((s) => s.user?.userID);
  return ["user", userId ?? "anon", "userInfo"] as const;
}

export function useUserInfo() {
  const key = useUserInfoKey();
  return useQuery({ queryKey: key, queryFn: () => profileApi.getUserInfo() });
}

export function useInvalidateUserInfo() {
  const queryClient = useQueryClient();
  const key = useUserInfoKey();
  return () => queryClient.invalidateQueries({ queryKey: key });
}

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: () => profileApi.getCountries(),
    staleTime: 24 * 60 * 60_000,
  });
}
