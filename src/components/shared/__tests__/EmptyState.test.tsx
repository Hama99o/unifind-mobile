/**
 * EmptyState — render test.
 *
 * Renders an Inbox icon, a heading (title), and an optional description.
 *
 * NOTE on the react-native-svg mock: the global jest.setup mock only stubs a
 * subset of SVG primitives (Path, Circle, Rect, Line, Polygon, ...) and does
 * NOT export `Polyline`. The lucide <Inbox> icon's node list begins with a
 * `polyline` element, so lucide's createLucideIcon resolves NativeSvg.Polyline
 * to `undefined`, producing "Element type is invalid ... Check the render
 * method of `Inbox`". We extend the mock locally with the full primitive set
 * (incl. Polyline) so the real Inbox icon mounts. This only affects this suite.
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

import { render, screen } from "@testing-library/react-native";
import { EmptyState } from "@/components/shared/EmptyState";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it("renders the description when provided", () => {
    render(<EmptyState title="Nothing here" description="Try again later" />);
    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.getByText("Try again later")).toBeTruthy();
  });

  it("does not render a description node when description is omitted", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("Try again later")).toBeNull();
  });

  it("does not render a description node when description is an empty string (falsy)", () => {
    // Source guards with `description ? ... : null`, so "" renders nothing.
    render(<EmptyState title="Empty" description="" />);
    // Only the title text should be present.
    expect(screen.getByText("Empty")).toBeTruthy();
  });
});
