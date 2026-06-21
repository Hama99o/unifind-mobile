/**
 * FavoritesTab — Profile > Favorites tab (Programs | Institutions | Offerings).
 *
 * Each sub-tab loads favorites keyed off authStore user.userID. With the user
 * logged out (no userId), every sub-tab loader short-circuits to [] and renders
 * its empty state. We keep the user logged out so the tabs settle deterministically
 * without needing catalog data.
 *
 * t() returns key strings; the empty-state titles are the assertion targets.
 *
 * NOTE on the react-native-svg mock: the global jest.setup mock only stubs a
 * subset of SVG primitives and does NOT export `Polyline` / `Ellipse`. The
 * empty states render <EmptyState>, whose lucide <Inbox> icon uses a `polyline`
 * element — with the global mock that resolves to `undefined`, crashing the
 * <Svg> component and unmounting the tree (the cause of the prior
 * "Unable to find node on an unmounted component" failures). We extend the mock
 * locally with the full primitive set (incl. Polyline) so EmptyState mounts.
 * Mirrors the workaround in ComparisonsTab.test.tsx / EmptyState.test.tsx;
 * affects only this suite.
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

import { renderWithProviders, screen, fireEvent } from "@/test-utils/renderWithProviders";
import { useAuthStore } from "@/stores/authStore";
import { FavoritesTab } from "@/screens/profile/tabs/FavoritesTab";

describe("FavoritesTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Logged out → every favorites loader returns [] (empty states).
    useAuthStore.setState({
      isLoggedIn: false,
      isBootstrapping: false,
      accessToken: null,
      user: null,
    });
  });

  it("renders the three sub-tab pills", () => {
    renderWithProviders(<FavoritesTab />);
    expect(screen.getByText("programs")).toBeTruthy();
    expect(screen.getByText("institutions")).toBeTruthy();
    expect(screen.getByText("offering")).toBeTruthy();
  });

  it("shows the Programs favorites empty state by default", async () => {
    renderWithProviders(<FavoritesTab />);
    expect(await screen.findByText("favorites.noPrograms")).toBeTruthy();
  });

  it("switches to the Institutions sub-tab and shows its empty state", async () => {
    renderWithProviders(<FavoritesTab />);
    expect(await screen.findByText("favorites.noPrograms")).toBeTruthy();

    fireEvent.press(screen.getByText("institutions"));

    expect(await screen.findByText("favorites.noInstitutions")).toBeTruthy();
    expect(screen.queryByText("favorites.noPrograms")).toBeNull();
  });

  it("switches to the Offerings sub-tab and shows its empty state", async () => {
    renderWithProviders(<FavoritesTab />);
    expect(await screen.findByText("favorites.noPrograms")).toBeTruthy();

    fireEvent.press(screen.getByText("offering"));

    expect(await screen.findByText("favorites.noOfferings")).toBeTruthy();
  });
});
