/**
 * Node API (user-owned data): bookings, favorites, compares, reviews,
 * payments, userinfo, academic/professional background, skills.
 *
 * Auth0 access token is attached per request from the auth store.
 * On 401: attempt a silent token refresh (via injected refreshFn from authService),
 *         then retry once. If refresh fails, sign out.
 */

import axios, { type AxiosRequestConfig } from "axios";
import { REQUEST_TIMEOUT_MS } from "@/api/timeouts";

export { REQUEST_TIMEOUT_MS };
import { useAuthStore } from "@/stores/authStore";
import { secureStorage, TOKEN_KEYS } from "@/utils/secure-storage";

// Extend AxiosRequestConfig to track retry state
interface RetryableRequestConfig extends AxiosRequestConfig {
  _retried?: boolean;
}


export const nodeApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_NODE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
});

// ─── Request interceptor — attach access token ─────────────────────────────────

nodeApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Refresh function injector (avoids circular dep with authService) ──────────
// authService registers its refresh fn here at module load.

let _nodeApiRefreshFn: (() => Promise<boolean>) | null = null;

export function registerNodeApiRefreshFn(fn: () => Promise<boolean>) {
  _nodeApiRefreshFn = fn;
}

// ─── Response interceptor — 401 → refresh-and-retry ───────────────────────────

// Dev-only: method, path, status and duration of each call (never headers or
// tokens) to diagnose hanging/failing endpoints during QA.
const devLog = (cfg: { method?: string; url?: string; metadata?: number } | undefined, status: unknown) => {
  if (!__DEV__ || !cfg) return;
  const ms = cfg.metadata ? Date.now() - cfg.metadata : -1;
  console.log("[nodeApi]", (cfg.method ?? "get").toUpperCase(), cfg.url, status, `${ms}ms`);
};
nodeApi.interceptors.request.use((config) => {
  (config as { metadata?: number }).metadata = Date.now();
  return config;
});

nodeApi.interceptors.response.use(
  (response) => {
    devLog(response.config as never, response.status);
    return response;
  },
  async (error: unknown) => {
    const e = error as { config?: never; response?: { status?: number }; code?: string };
    devLog(e.config, e.response?.status ?? e.code ?? "ERR");
    const axiosError = error as { response?: { status?: number }; config?: RetryableRequestConfig };
    const originalRequest = axiosError.config;

    if (
      axiosError.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      useAuthStore.getState().isLoggedIn
    ) {
      originalRequest._retried = true;

      if (_nodeApiRefreshFn) {
        try {
          const refreshed = await _nodeApiRefreshFn();
          if (refreshed) {
            const newToken = await secureStorage.get(TOKEN_KEYS.access);
            if (newToken) {
              originalRequest.headers = originalRequest.headers ?? {};
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            }
            return nodeApi(originalRequest);
          }
        } catch {
          // Refresh threw — fall through to sign out
        }
      }

      // Refresh failed — sign out
      await useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);
