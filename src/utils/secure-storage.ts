import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

interface TokenStore {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
}

/**
 * Native (iOS/Android): Keychain/Keystore via expo-secure-store — the secure
 * path tokens MUST use (AUTH_SECURITY §5).
 */
const nativeStore: TokenStore = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};

/**
 * Web has no secure-store native module. The web build is a DEV/PREVIEW surface
 * only (real auth runs on device), so fall back to localStorage there.
 */
const webStore: TokenStore = {
  get: async (key) =>
    typeof localStorage !== "undefined" ? localStorage.getItem(key) : null,
  set: async (key, value) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  },
  remove: async (key) => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  },
};

/** Token-grade storage. Native → secure-store; web (preview) → localStorage. */
export const secureStorage: TokenStore =
  Platform.OS === "web" ? webStore : nativeStore;

export const TOKEN_KEYS = {
  access: "uf.accessToken",
  refresh: "uf.refreshToken",
} as const;
