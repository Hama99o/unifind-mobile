/**
 * secure-storage.test.ts — unit tests for the token-grade storage adapter.
 *
 * secureStorage is chosen AT IMPORT TIME based on Platform.OS:
 *   - native (default jest-expo platform = "ios") → expo-secure-store
 *     (getItemAsync/setItemAsync/deleteItemAsync) — globally mocked in-memory.
 *   - web → localStorage (or no-op when localStorage is undefined).
 *
 * Because the branch is picked at module load, we test the web path with
 * jest.isolateModules after overriding Platform.OS, so a fresh module instance
 * resolves the webStore.
 *
 * TOKEN_KEYS is a frozen-ish constant map of the two key names.
 */

import { secureStorage, TOKEN_KEYS } from "@/utils/secure-storage";
import * as SecureStore from "expo-secure-store";

describe("TOKEN_KEYS", () => {
  it("exposes the access & refresh token key names", () => {
    expect(TOKEN_KEYS.access).toBe("uf.accessToken");
    expect(TOKEN_KEYS.refresh).toBe("uf.refreshToken");
  });
});

describe("secureStorage — native (expo-secure-store, default platform=ios)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("set then get round-trips a value through SecureStore", async () => {
    await secureStorage.set("k1", "v1");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("k1", "v1");

    const value = await secureStorage.get("k1");
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith("k1");
    expect(value).toBe("v1");
  });

  it("get returns null for a key that was never set", async () => {
    const value = await secureStorage.get("missing-key-xyz");
    expect(value).toBeNull();
  });

  it("remove deletes a value (subsequent get returns null)", async () => {
    await secureStorage.set("k2", "v2");
    expect(await secureStorage.get("k2")).toBe("v2");

    await secureStorage.remove("k2");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("k2");
    expect(await secureStorage.get("k2")).toBeNull();
  });

  it("delegates to the underlying SecureStore async methods", async () => {
    await secureStorage.set("k3", "v3");
    await secureStorage.get("k3");
    await secureStorage.remove("k3");
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    expect(SecureStore.getItemAsync).toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("stores token values under the canonical TOKEN_KEYS names", async () => {
    await secureStorage.set(TOKEN_KEYS.access, "acc");
    await secureStorage.set(TOKEN_KEYS.refresh, "ref");
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBe("acc");
    expect(await secureStorage.get(TOKEN_KEYS.refresh)).toBe("ref");
  });
});

describe("secureStorage — web (localStorage fallback)", () => {
  /**
   * Load a fresh secureStorage with Platform.OS forced to "web" and a given
   * localStorage implementation in scope.
   */
  function loadWebStorage(localStorageImpl: Storage | undefined) {
    let mod: typeof import("@/utils/secure-storage");
    jest.isolateModules(() => {
      // Force the web branch for this isolated module graph.
      // secure-storage only reads Platform.OS from react-native, so provide a
      // minimal mock. Spreading requireActual("react-native") would eagerly
      // evaluate lazy native modules (DevMenu/TurboModuleRegistry) and crash in
      // the jest env, so we do NOT touch the real module here.
      jest.doMock("react-native", () => ({
        Platform: { OS: "web", select: (obj: Record<string, unknown>) => obj.web },
      }));
      // Provide / clear the global localStorage the module reads.
      Object.defineProperty(global, "localStorage", {
        configurable: true,
        writable: true,
        value: localStorageImpl,
      });
      mod = require("@/utils/secure-storage");
    });
    jest.dontMock("react-native");
    // @ts-expect-error assigned synchronously inside isolateModules
    return mod;
  }

  function makeLocalStorage(): Storage {
    const data: Record<string, string> = {};
    return {
      getItem: jest.fn((k: string) => (k in data ? data[k] : null)),
      setItem: jest.fn((k: string, v: string) => {
        data[k] = String(v);
      }),
      removeItem: jest.fn((k: string) => {
        delete data[k];
      }),
      clear: jest.fn(() => {
        for (const k of Object.keys(data)) delete data[k];
      }),
      key: jest.fn(),
      length: 0,
    } as unknown as Storage;
  }

  afterEach(() => {
    // Drop the test localStorage so it does not leak into other suites.
    Object.defineProperty(global, "localStorage", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it("set then get round-trips through localStorage", async () => {
    const ls = makeLocalStorage();
    const { secureStorage: ws } = loadWebStorage(ls);

    await ws.set("wk1", "wv1");
    expect(ls.setItem).toHaveBeenCalledWith("wk1", "wv1");

    const value = await ws.get("wk1");
    expect(ls.getItem).toHaveBeenCalledWith("wk1");
    expect(value).toBe("wv1");
  });

  it("get returns null for a missing key", async () => {
    const ls = makeLocalStorage();
    const { secureStorage: ws } = loadWebStorage(ls);
    expect(await ws.get("nope")).toBeNull();
  });

  it("remove deletes the value from localStorage", async () => {
    const ls = makeLocalStorage();
    const { secureStorage: ws } = loadWebStorage(ls);
    await ws.set("wk2", "wv2");
    await ws.remove("wk2");
    expect(ls.removeItem).toHaveBeenCalledWith("wk2");
    expect(await ws.get("wk2")).toBeNull();
  });

  it("get returns null when localStorage is undefined (no crash)", async () => {
    const { secureStorage: ws } = loadWebStorage(undefined);
    await expect(ws.get("anything")).resolves.toBeNull();
  });

  it("set is a safe no-op when localStorage is undefined (no crash)", async () => {
    const { secureStorage: ws } = loadWebStorage(undefined);
    await expect(ws.set("k", "v")).resolves.toBeUndefined();
  });

  it("remove is a safe no-op when localStorage is undefined (no crash)", async () => {
    const { secureStorage: ws } = loadWebStorage(undefined);
    await expect(ws.remove("k")).resolves.toBeUndefined();
  });
});
