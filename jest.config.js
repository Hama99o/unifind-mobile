/**
 * jest.config.js — unifind-mobile test configuration.
 *
 * Preset: jest-expo (handles RN + Expo transforms, platform aliases,
 * Babel preset for the Expo SDK, haste defaultPlatform=ios).
 *
 * transformIgnorePatterns: the jest-expo default pattern is extended to
 * also NOT ignore (i.e. to transform) every native/Expo package that ships
 * untranspiled ESM or JSX. The combined regex covers:
 *   react-native, @react-native, expo(nent)?, @expo, react-native-reanimated,
 *   react-native-gesture-handler, nativewind, react-native-css-interop,
 *   @react-navigation, expo-router, lucide-react-native, react-native-svg,
 *   @react-native-community, react-native-webview, expo-modules-core.
 *
 * Module resolution:
 *   - @/* alias maps to <rootDir>/src/* (matches tsconfig paths).
 *   - Platform-split files (.native/.web) are handled by jest-expo's haste
 *     config (defaultPlatform:'ios') so Metro-style platform extensions
 *     resolve correctly (e.g. PaymentWebViewScreen.native.tsx wins over .web).
 *
 * i18n: jest.setup.ts mocks @/i18n so translations resolve synchronously.
 * Axios: jest.setup.ts mocks @/api/http and @/api/nodeApi so tests are
 *        fully offline by default (overridable per test).
 */

/** @type {import('jest').Config} */
const config = {
  preset: "jest-expo",

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // @/ path alias matching tsconfig.json paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  /**
   * Jest-only Babel transform. We deliberately do NOT load the app's
   * babel.config.js here (configFile/babelrc: false) — that config includes
   * `nativewind/babel`, which wraps every createElement/JSX node with a
   * module-level `_ReactNativeCSSInterop` helper. Inside hoisted jest.mock()
   * factories that triggers babel-plugin-jest-hoist's "out-of-scope variable"
   * error and prevents any suite from running. Tests assert behaviour, not
   * computed styles, so dropping NativeWind here is correct — `className`
   * simply becomes an inert prop. The APP build keeps the canonical NativeWind
   * babel config untouched (required for styles to apply on native).
   */
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs)$": [
      "babel-jest",
      {
        configFile: false,
        babelrc: false,
        presets: [["babel-preset-expo"]],
      },
    ],
  },

  /**
   * Transform everything that is NOT in node_modules, EXCEPT for the
   * packages listed here which must be transformed (they ship raw ESM/JSX).
   *
   * The regex is the standard jest-expo pattern with all common Expo/RN
   * packages appended so we don't get "Cannot use import statement" errors.
   */
  transformIgnorePatterns: [
    "node_modules/(?!(" +
      "react-native|" +
      "@react-native|" +
      "expo(nent)?|" +
      "@expo|" +
      "react-native-reanimated|" +
      "react-native-gesture-handler|" +
      "nativewind|" +
      "react-native-css-interop|" +
      "@react-navigation|" +
      "expo-router|" +
      "lucide-react-native|" +
      "react-native-svg|" +
      "@react-native-community|" +
      "react-native-webview|" +
      "expo-modules-core|" +
      "@shopify/flash-list|" +
      "react-native-safe-area-context|" +
      "react-native-screens|" +
      "react-native-worklets|" +
      "@gluestack-ui|" +
      "class-variance-authority" +
    "))",
  ],

  testMatch: [
    "**/__tests__/**/*.test.{ts,tsx}",
    "**/*.test.{ts,tsx}",
  ],

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.types.ts",
    "!src/components/ui/skeleton.tsx",
    "!src/**/__tests__/**",
  ],

  /**
   * haste platform config: jest-expo sets defaultPlatform to "ios" and
   * platforms to ["ios","android","native","web"].  We re-declare to be
   * explicit and ensure PaymentWebViewScreen.native.tsx resolves correctly
   * over the .web counterpart in the test environment.
   */
  haste: {
    defaultPlatform: "ios",
    platforms: ["ios", "android", "native", "web"],
  },

  // Avoids spurious timeout on slow CI machines
  testTimeout: 15000,
};

module.exports = config;
