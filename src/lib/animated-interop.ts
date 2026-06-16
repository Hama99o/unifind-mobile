import Animated from "react-native-reanimated";
import { cssInterop } from "nativewind";

/**
 * NativeWind does NOT auto-map `className` → `style` on reanimated's
 * `Animated.*` components. Without this, className layout (flex-row, gap,
 * padding, width) is silently dropped on Animated.View/ScrollView — e.g. a
 * `flex-row` row collapses to a full-width column. Register them once so
 * className works app-wide; animated styles passed via `style` still merge.
 *
 * Imported for its side effect in app/_layout.tsx before any screen renders.
 */
cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.ScrollView, { className: "style" });
