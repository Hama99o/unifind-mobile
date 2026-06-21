/**
 * ProgramCard — render + interaction behaviour.
 *
 * NOTE: ProgramCard does NOT use t(); compareLabel/primaryLabel default to the
 * literal English strings "Add to Compare" / "Check Program" (asserted verbatim).
 * Buttons expose testIDs: card-program-compare / card-program-primary.
 * The favorite heart Pressable has testID card-program-favorite and
 * accessibilityRole="button".
 */

// The ProgramCard renders a lucide <Clock> icon, whose iconNode includes a
// "polyline" element. The global react-native-svg mock (jest.setup.ts) does
// not export `Polyline`, so lucide's Icon resolves `NativeSvg.Polyline` to
// undefined and every render throws "Element type is invalid ... Check the
// render method of `Clock`". We re-declare the svg mock here (a test-file
// jest.mock overrides the setup mock) with the same host-tag shape PLUS the
// extra primitives lucide may reference, so the icons mount.
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

import { render, screen, fireEvent } from "@testing-library/react-native";
import { ProgramCard, type ProgramCardProps } from "@/components/cards/ProgramCard";

const baseProps: ProgramCardProps = {
  documentId: "prog-1",
  programTitle: "BSc Computer Science",
  universityName: "Acme University",
  location: "Beirut, Lebanon",
  duration: "4 years",
  degree: "Bachelor",
};

describe("ProgramCard", () => {
  it("renders title, university, and the required meta chips", () => {
    render(<ProgramCard {...baseProps} />);
    expect(screen.getByText("BSc Computer Science")).toBeTruthy();
    expect(screen.getByText("Acme University")).toBeTruthy();
    expect(screen.getByText("Beirut, Lebanon")).toBeTruthy();
    expect(screen.getByText("4 years")).toBeTruthy();
    expect(screen.getByText("Bachelor")).toBeTruthy();
  });

  it("renders default action labels", () => {
    render(<ProgramCard {...baseProps} />);
    expect(screen.getByText("Add to Compare")).toBeTruthy();
    expect(screen.getByText("Check Program")).toBeTruthy();
  });

  it("renders custom action labels when provided", () => {
    render(<ProgramCard {...baseProps} compareLabel="Compare" primaryLabel="View" />);
    expect(screen.getByText("Compare")).toBeTruthy();
    expect(screen.getByText("View")).toBeTruthy();
  });

  it("renders the description when present", () => {
    render(<ProgramCard {...baseProps} description="A four-year program." />);
    expect(screen.getByText("A four-year program.")).toBeTruthy();
  });

  it("does not render a description block when description is omitted", () => {
    render(<ProgramCard {...baseProps} />);
    expect(screen.queryByText("A four-year program.")).toBeNull();
  });

  it("renders the optional fees chip only when fees is provided", () => {
    const { rerender } = render(<ProgramCard {...baseProps} />);
    expect(screen.queryByText("$5,000")).toBeNull();
    rerender(<ProgramCard {...baseProps} fees="$5,000" />);
    expect(screen.getByText("$5,000")).toBeTruthy();
  });

  it("renders the optional language chip only when language is provided", () => {
    const { rerender } = render(<ProgramCard {...baseProps} />);
    expect(screen.queryByText("English")).toBeNull();
    rerender(<ProgramCard {...baseProps} language="English" />);
    expect(screen.getByText("English")).toBeTruthy();
  });

  it("fires onAddToCompare and onPrimaryClick when the action buttons are pressed", () => {
    const onAddToCompare = jest.fn();
    const onPrimaryClick = jest.fn();
    render(
      <ProgramCard
        {...baseProps}
        onAddToCompare={onAddToCompare}
        onPrimaryClick={onPrimaryClick}
      />
    );
    fireEvent.press(screen.getByTestId("card-program-compare"));
    fireEvent.press(screen.getByTestId("card-program-primary"));
    expect(onAddToCompare).toHaveBeenCalledTimes(1);
    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it("does not render the favorite heart when onToggleFavorite is absent", () => {
    render(<ProgramCard {...baseProps} />);
    expect(screen.queryByTestId("card-program-favorite")).toBeNull();
  });

  it("renders the favorite heart and fires onToggleFavorite when pressed", () => {
    const onToggleFavorite = jest.fn();
    render(<ProgramCard {...baseProps} onToggleFavorite={onToggleFavorite} />);
    fireEvent.press(screen.getByTestId("card-program-favorite"));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it("exposes the 'Add to favorites' a11y label when not favorited", () => {
    render(<ProgramCard {...baseProps} onToggleFavorite={jest.fn()} isFavorite={false} />);
    expect(screen.getByLabelText("Add to favorites")).toBeTruthy();
  });

  it("exposes the 'Remove from favorites' a11y label when favorited", () => {
    render(<ProgramCard {...baseProps} onToggleFavorite={jest.fn()} isFavorite={true} />);
    expect(screen.getByLabelText("Remove from favorites")).toBeTruthy();
  });

  it("renders a placeholder icon (no logo) when logoSrc is absent and still mounts", () => {
    const { toJSON } = render(<ProgramCard {...baseProps} />);
    expect(toJSON()).toBeTruthy();
  });
});
