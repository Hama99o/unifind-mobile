/**
 * date-field — type-only barrel for the cross-platform date picker.
 *
 * .d.ts so Metro never bundles it; it resolves the platform file at runtime:
 *   - date-field.web.tsx    → web  (<input type="date">)
 *   - date-field.native.tsx → iOS/Android (@react-native-community/datetimepicker)
 */
export { DateField } from "./date-field.native";
export type { DateFieldProps } from "./date-field.native";
