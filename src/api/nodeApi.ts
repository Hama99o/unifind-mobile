import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

/**
 * Node API (user-owned data): bookings, favorites, compares, reviews,
 * payments, userinfo, academic/professional background, skills.
 * The Auth0 access token is attached per request from the auth store.
 */
export const nodeApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_NODE_API_URL,
  headers: { "Content-Type": "application/json" },
});

nodeApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
