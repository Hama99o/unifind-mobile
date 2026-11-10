/**
 * Guard: every scrolling form screen uses KeyboardSafeScrollView. On Android
 * edge-to-edge neither adjustResize nor KeyboardAvoidingView moves content, so
 * a plain ScrollView leaves the focused field under the keyboard
 * (BUG-13 Home/footer; QA 2026-11-10 again on Profile Information).
 * The component's own behaviour is tested in KeyboardSafeScrollView.test.tsx.
 */
import * as fs from "fs";
import * as path from "path";

const FORM_SCREENS = [
  "src/screens/profile/tabs/ProfileInformationTab.tsx",
  "src/screens/profile/tabs/AccountCredentialsTab.tsx",
  "src/screens/profile/tabs/about/OverviewSection.tsx",
  "src/screens/profile/tabs/about/ProfessionalBackgroundSection.tsx",
];

describe("form screens scroll the focused input above the keyboard", () => {
  it.each(FORM_SCREENS)("%s uses KeyboardSafeScrollView", (file) => {
    const src = fs.readFileSync(path.join(__dirname, "../../../..", file), "utf8");
    expect(src).toMatch(/<KeyboardSafeScrollView\b/);
  });
});
