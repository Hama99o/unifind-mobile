/**
 * ComparisonsTab — Profile > Comparisons tab (Programs | Institutions).
 *
 * Both sub-tabs load compare IDs via comparesApi.getCompareIds → nodeApi.get.
 * The default global mock resolves { data: {} } (type !== "success") → [] →
 * empty states render.
 *
 * t() returns key strings.
 *
 * NOTE on the react-native-svg mock: the global jest.setup mock only stubs a
 * subset of SVG primitives and does NOT export `Polyline` / `Ellipse`. The
 * empty states render <EmptyState>, whose lucide <Inbox> icon begins with a
 * `polyline` element — with the global mock that resolves to `undefined`,
 * crashing the <Svg> component and unmounting the tree (the cause of the prior
 * "Unable to find node on an unmounted component" failures). We extend the
 * mock locally with the full primitive set (incl. Polyline) so EmptyState
 * mounts. Mirrors the workaround in EmptyState.test.tsx; affects only this suite.
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
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";
import { useCompareStore } from "@/stores/compareStore";
import { ComparisonsTab } from "@/screens/profile/tabs/ComparisonsTab";

describe("ComparisonsTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCompareStore.getState().setCompared("Program", []);
    useCompareStore.getState().setCompared("Institution", []);
    (nodeApi.get as jest.Mock).mockResolvedValue({ data: {} });
    (http.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it("renders both sub-tab pills", () => {
    renderWithProviders(<ComparisonsTab />);
    expect(screen.getByText("programs")).toBeTruthy();
    expect(screen.getByText("institutions")).toBeTruthy();
  });

  it("shows the Programs comparisons empty state by default", async () => {
    renderWithProviders(<ComparisonsTab />);
    expect(await screen.findByText("comparisons.noPrograms")).toBeTruthy();
  });

  it("switches to the Institutions sub-tab and shows its empty state", async () => {
    renderWithProviders(<ComparisonsTab />);
    expect(await screen.findByText("comparisons.noPrograms")).toBeTruthy();

    fireEvent.press(screen.getByText("institutions"));

    expect(await screen.findByText("comparisons.noInstitutions")).toBeTruthy();
    expect(screen.queryByText("comparisons.noPrograms")).toBeNull();
  });
});
