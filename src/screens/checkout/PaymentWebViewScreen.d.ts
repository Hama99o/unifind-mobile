/**
 * PaymentWebViewScreen — type-only barrel for the cross-platform component.
 *
 * This is a .d.ts so Metro NEVER bundles it (declaration files are not in the
 * bundler graph). At runtime Metro resolves the platform file by extension:
 *   - PaymentWebViewScreen.web.tsx    → web  (Linking.openURL — no react-native-webview)
 *   - PaymentWebViewScreen.native.tsx → iOS/Android (react-native-webview)
 * TypeScript resolves this declaration for `@/screens/checkout/PaymentWebViewScreen`.
 */
export { PaymentWebViewScreen } from "./PaymentWebViewScreen.native";
export type { PaymentWebViewScreenProps } from "./PaymentWebViewScreen.native";
