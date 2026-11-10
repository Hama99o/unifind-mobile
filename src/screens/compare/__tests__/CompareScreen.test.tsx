/**
 * CompareScreen — standalone compare view (auth-gated).
 *
 * Logged out → SignedOutPlaceholder (signInRequired + signIn CTA) and the
 * Sign In button on the placeholder opens the sign-in sheet.
 * Logged in → CompareTabs (Programs | Institutions sub-tabs). Each sub-tab loads
 * compare IDs from comparesApi.getCompareIds, which is transport over the global
 * nodeApi.get mock. The default mock resolves { data: {} }, so getCompareIds sees
 * res.data.type !== "success" and returns [] → the empty state renders.
 *
 * initialTab is derived from useLocalSearchParams().tab (global mock → {} →
 * defaults to "programs").
 *
 * NOTE on the react-native-svg mock: both the signed-out placeholder and the
 * empty compare tabs render <EmptyState>, whose <Inbox> lucide icon begins with
 * a `polyline` element. The global jest.setup react-native-svg mock does NOT
 * export `Polyline`, so lucide's createLucideIcon resolves NativeSvg.Polyline to
 * `undefined` → "Element type is invalid ... Check the render method of `Inbox`",
 * crashing every render. We extend the mock locally with the full primitive set
 * (incl. Polyline + Ellipse) so the real Inbox icon mounts. Mirrors the same fix
 * documented in components/shared/__tests__/EmptyState.test.tsx; scoped to this suite.
 */

jest.mock("react-native-svg", () => {
  const React = require("react");
  const make = (tag: string) => (props: Record<string, unknown>) =>
    React.createElement(tag, props, (props as { children?: unknown }).children);
  const Svg = make("Svg");
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Path: make("Path"),
    Circle: make("Circle"),
    Rect: make("Rect"),
    G: make("G"),
    Defs: make("Defs"),
    Stop: make("Stop"),
    LinearGradient: make("SvgLinearGradient"),
    RadialGradient: make("SvgRadialGradient"),
    ClipPath: make("ClipPath"),
    Line: make("Line"),
    Polygon: make("Polygon"),
    Polyline: make("Polyline"),
    Ellipse: make("Ellipse"),
    Text: make("SvgText"),
  };
});

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";
import { useAuthStore } from "@/stores/authStore";
import { useSignInSheetStore } from "@/auth/signInSheetStore";
import { useCompareStore } from "@/stores/compareStore";
import CompareScreen from "@/screens/compare/CompareScreen";

function login() {
  useAuthStore.setState({
    isLoggedIn: true,
    isBootstrapping: false,
    accessToken: "tok",
    user: { sub: "auth0|abc", userID: "abc", name: "Test" },
  });
}

function logout() {
  useAuthStore.setState({
    isLoggedIn: false,
    isBootstrapping: false,
    accessToken: null,
    user: null,
  });
}

describe("CompareScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSignInSheetStore.setState({ isOpen: false });
    // Reset compare store slots.
    useCompareStore.getState().setCompared("Program", []);
    useCompareStore.getState().setCompared("Institution", []);
    // Default API responses: no compare ids, no catalog rows.
    (nodeApi.get as jest.Mock).mockResolvedValue({ data: {} });
    (http.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it("renders the signed-out placeholder; its Sign In button opens the sheet (no auto-open)", async () => {
    logout();
    renderWithProviders(<CompareScreen />);
    expect(await screen.findByText("signInRequired")).toBeTruthy();
    expect(screen.getByText("compareSignInDescription")).toBeTruthy();
    // signIn CTA button.
    expect(screen.getByText("signIn")).toBeTruthy();
    // No auto-open on mount (BUG-04: a global sheet must not cover the page).
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
    fireEvent.press(screen.getByText("signIn"));
    expect(useSignInSheetStore.getState().isOpen).toBe(true);
  });

  it("renders the compare tabs with the empty program-comparisons state when logged in", async () => {
    login();
    renderWithProviders(<CompareScreen />);
    // Both sub-tab pills render (Programs default-active, Institutions available).
    expect(await screen.findByText("programs")).toBeTruthy();
    expect(screen.getByText("institutions")).toBeTruthy();
    // Programs tab is active by default → its empty state shows.
    await waitFor(() => expect(screen.getByText("comparisons.noPrograms")).toBeTruthy());
  });

  it("switches to the Institutions sub-tab and shows its empty state", async () => {
    login();
    renderWithProviders(<CompareScreen />);
    await waitFor(() => expect(screen.getByText("comparisons.noPrograms")).toBeTruthy());

    // Tap the Institutions pill.
    fireEvent.press(screen.getByText("institutions"));

    await waitFor(() =>
      expect(screen.getByText("comparisons.noInstitutions")).toBeTruthy()
    );
    // Programs empty state no longer mounted.
    expect(screen.queryByText("comparisons.noPrograms")).toBeNull();
  });
});
