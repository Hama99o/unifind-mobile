/**
 * jest.setup.ts — global test setup for unifind-mobile.
 *
 * Loaded via setupFilesAfterEnv. Runs after the test framework is installed
 * but before any test file. All mocks here are module-level (jest.mock hoisted).
 *
 * Strategy:
 *   1. Reanimated 4 test support.
 *   2. Gesture handler native mock.
 *   3. Native-only module stubs (secure store, date picker, webview, etc.).
 *   4. Axios instance mocks — tests run fully offline by default.
 *   5. i18n — synchronous stub so component tests are deterministic.
 *   6. Console noise suppression.
 */

// ─── 1. Reanimated 4 ─────────────────────────────────────────────────────────
// react-native-reanimated 4.x ships a setUpTests helper. Call it if present;
// fall back to a no-op mock so Animated/usePressScale don't crash.
try {
  const Reanimated = require("react-native-reanimated");
  if (typeof Reanimated.setUpTests === "function") {
    Reanimated.setUpTests();
  }
} catch {
  // Not installed yet (before deps install on CI) — silence.
}

// ─── 2. Gesture handler ──────────────────────────────────────────────────────
try {
  require("react-native-gesture-handler/jestSetup");
} catch {
  // Not installed yet — silence.
}

// ─── 3. Native-only module stubs ─────────────────────────────────────────────

// expo-secure-store — in-memory implementation so authStore/tokenStore work.
jest.mock("expo-secure-store", () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
    SecureStoreAccessible: { WHEN_UNLOCKED: "WHEN_UNLOCKED" },
  };
});

// @react-native-community/datetimepicker — stub component
// NOTE: render a plain string host tag (not the RN `View` component). The
// nativewind babel plugin rewrites createElement of registered RN components to
// reference a module-level `_ReactNativeCSSInterop` helper; inside a hoisted
// jest.mock factory that triggers babel-plugin-jest-hoist's out-of-scope error.
// A string host tag is not cssInterop-registered, so it is left untouched.
jest.mock("@react-native-community/datetimepicker", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement("RNDateTimePicker", { testID: "datetimepicker", ...props }),
    DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
  };
});

// react-native-webview — stub WebView (string host tag — see note above)
jest.mock("react-native-webview", () => {
  const React = require("react");
  const WebView = (props: Record<string, unknown>) =>
    React.createElement("RNCWebView", { testID: "webview", ...props });
  return { WebView, default: WebView };
});

// expo-image-picker — stub
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: true,
    assets: null,
  })),
  MediaTypeOptions: { Images: "Images", All: "All" },
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({
    status: "granted",
    granted: true,
  })),
}));

// expo-auth-session — stub for Auth0 PKCE flow
jest.mock("expo-auth-session", () => ({
  AuthRequest: jest.fn().mockImplementation(() => ({
    promptAsync: jest.fn(async () => ({ type: "cancel" })),
    makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
    codeVerifier: "mock-verifier",
  })),
  exchangeCodeAsync: jest.fn(async () => ({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    idToken: "mock-id-token",
    expiresIn: 3600,
  })),
  makeRedirectUri: jest.fn(() => "unifind://auth/callback"),
  ResponseType: { Code: "code" },
  CodeChallengeMethod: { S256: "S256" },
  resolveDiscoveryAsync: jest.fn(async () => ({
    authorizationEndpoint: "https://mock.auth/authorize",
    tokenEndpoint: "https://mock.auth/oauth/token",
    revocationEndpoint: "https://mock.auth/oauth/revoke",
  })),
}));

// expo-web-browser — stub
jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: jest.fn(async () => ({ type: "cancel" })),
  openBrowserAsync: jest.fn(async () => ({ type: "cancel" })),
  dismissBrowser: jest.fn(),
  maybeCompleteAuthSession: jest.fn(() => ({ type: "success" })),
}));

// expo-crypto — stub
jest.mock("expo-crypto", () => ({
  digestStringAsync: jest.fn(async (_alg: string, data: string) =>
    Buffer.from(data).toString("base64")
  ),
  getRandomBytesAsync: jest.fn(async (size: number) =>
    new Uint8Array(size).fill(42)
  ),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

// @react-native-community/slider — stub component (string host tag — see note above)
jest.mock("@react-native-community/slider", () => {
  const React = require("react");
  const Slider = (props: Record<string, unknown>) =>
    React.createElement("RNCSlider", { testID: "slider", ...props });
  return { __esModule: true, default: Slider };
});

// react-native-svg — render children/host tags so GradientView, lucide icons,
// etc. mount. Explicit named exports (NOT a Proxy — a Proxy breaks babel's ESM
// interop for lucide-react-native and makes icon elements resolve to undefined).
// The list covers every primitive lucide's iconNodes use — crucially `Polyline`
// and `Ellipse`, whose omission previously crashed icons like Inbox and Clock
// ("Element type is invalid … Check the render method of `Inbox`").
jest.mock("react-native-svg", () => {
  const React = require("react");
  // Host-tag names are kept RAW for the SVG primitives (so a node's `type` is
  // exactly "Svg", "Path", "Polygon", … — tests may match on these). Only the
  // names that collide with real RN host components (Text, LinearGradient,
  // RadialGradient, Image) get an "Svg" prefix, matching the original mock.
  const make = (tag: string) => (props: Record<string, unknown>) =>
    React.createElement(tag, props, (props as { children?: unknown }).children);
  const Svg = make("Svg");
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Path: make("Path"),
    Circle: make("Circle"),
    Ellipse: make("Ellipse"),
    Rect: make("Rect"),
    Line: make("Line"),
    Polyline: make("Polyline"),
    Polygon: make("Polygon"),
    G: make("G"),
    Text: make("SvgText"),
    TSpan: make("SvgTSpan"),
    TextPath: make("SvgTextPath"),
    Defs: make("Defs"),
    Use: make("Use"),
    Symbol: make("Symbol"),
    Stop: make("Stop"),
    LinearGradient: make("SvgLinearGradient"),
    RadialGradient: make("SvgRadialGradient"),
    ClipPath: make("ClipPath"),
    Mask: make("Mask"),
    Pattern: make("Pattern"),
    Image: make("SvgImage"),
    ForeignObject: make("ForeignObject"),
    Marker: make("Marker"),
  };
});

// expo-status-bar — stub
jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
  setStatusBarStyle: jest.fn(),
}));

// expo-router — stub the parts used in components (router.push etc.)
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: unknown }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Redirect: () => null,
}));

// expo-constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { name: "unifind-mobile", extra: {} } },
}));

// react-native-safe-area-context — stub
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  SafeAreaView: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

// react-native-screens — stub
jest.mock("react-native-screens", () => ({
  enableScreens: jest.fn(),
  Screen: ({ children }: { children: unknown }) => children,
  ScreenContainer: ({ children }: { children: unknown }) => children,
}));

// @tanstack/react-query — provide a default QueryClient for component tests
jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
  };
});

// ─── 4. Axios instance mocks — fully offline by default ──────────────────────
//
// Tests that need real responses can use:
//   const { http } = require('@/api/http');
//   (http.get as jest.Mock).mockResolvedValueOnce({ data: { ... } });
//
// @/api/http — Strapi (catalog)
jest.mock("@/api/http", () => {
  const mockHttp = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return { http: mockHttp, default: mockHttp };
});

// @/api/nodeApi — Node API (user data)
jest.mock("@/api/nodeApi", () => {
  const mockNodeApi = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return {
    nodeApi: mockNodeApi,
    registerNodeApiRefreshFn: jest.fn(),
    default: mockNodeApi,
  };
});

// ─── 5. i18n — synchronous stub ──────────────────────────────────────────────
//
// Strategy: mock @/i18n so I18nManager.forceRTL never fires in tests (it
// triggers a native reload), and mock the two hooks so every component test
// gets deterministic, English, LTR translations without spinning up react-i18next.
//
// The mock t() returns the key itself so tests can assert on translation keys
// or on raw values (callers using a real t stub can override per test).

jest.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    isInitialized: true,
    language: "en",
    t: (key: string) => key,
    on: jest.fn(),
    off: jest.fn(),
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
  },
  RTL_LANGS: ["ar"],
  DEFAULT_LANG: "en",
  isRtlLang: (lng: string) => lng === "ar",
  applyDirection: jest.fn(),
}));

jest.mock("@/hooks/useCustomTranslation", () => ({
  useCustomTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
    lang: "en",
    isRtl: false,
  }),
}));

jest.mock("@/hooks/useLocalization", () => ({
  useLocalization: () => ({
    locale: "en",
    formatDate: (v: string | number | Date) => new Date(v).toLocaleDateString("en"),
    formatTime: (v: string | number | Date) => new Date(v).toLocaleTimeString("en"),
    formatNumber: (v: number) => String(v),
    formatCurrency: (v: number, currency = "USD") =>
      currency === "USD" ? `$${v.toFixed(2)}` : `LBP ${v}`,
    formatPercent: (v: number) => `${(v * 100).toFixed(1)}%`,
  }),
}));

jest.mock("@/hooks/useColors", () => ({
  useColors: () => ({
    primary: "#0D4E6B",
    secondary: "#00C9B8",
    background: "#FFFFFF",
    foreground: "#1A1A2E",
    muted: "#F5F5F5",
    mutedForeground: "#888",
    border: "#E0E0E0",
    card: "#FFFFFF",
    destructive: "#E53E3E",
  }),
}));

// Zustand stores — keep them real (they're pure JS, no native deps)
// but reset state between tests via the store's own methods.

// ─── 6. Console noise suppression ─────────────────────────────────────────────
const SUPPRESS_PATTERNS = [
  /Warning: ReactDOM.render is no longer supported/,
  /Warning: An update to .+ inside a test was not wrapped in act/,
  /Could not find "store"/,
  /NativeWind/,
  /useColorScheme/,
  /useNativeDriver/,
  /Animated: \`useNativeDriver\`/,
  /Warning: React.createElement: type is invalid/,
  /VirtualizedLists should never be nested/,
  /Each child in a list should have a unique "key" prop/,
];

const _consoleError = console.error.bind(console);
const _consoleWarn = console.warn.bind(console);

console.error = (...args: unknown[]) => {
  if (SUPPRESS_PATTERNS.some((p) => p.test(String(args[0])))) return;
  _consoleError(...args);
};

console.warn = (...args: unknown[]) => {
  if (SUPPRESS_PATTERNS.some((p) => p.test(String(args[0])))) return;
  _consoleWarn(...args);
};
