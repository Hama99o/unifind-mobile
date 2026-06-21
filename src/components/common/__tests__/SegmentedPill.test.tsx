/**
 * SegmentedPill — render + interaction tests.
 *
 * Source: src/components/common/SegmentedPill.tsx
 * - Renders the label (with optional leading icon at size 15).
 * - accessibilityRole="tab"; accessibilityState.selected mirrors `active`.
 * - onPress fires on press.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { SegmentedPill } from "@/components/common/SegmentedPill";

describe("SegmentedPill", () => {
  it("renders the label", () => {
    render(<SegmentedPill label="Favorites" active={false} onPress={jest.fn()} />);
    expect(screen.getByText("Favorites")).toBeTruthy();
  });

  it("exposes accessibilityRole tab and selected=false when inactive", () => {
    render(<SegmentedPill label="Tab A" active={false} onPress={jest.fn()} />);
    const pill = screen.getByRole("tab");
    expect(pill).toBeTruthy();
    expect(pill.props.accessibilityState).toEqual({ selected: false });
  });

  it("marks selected=true when active", () => {
    render(<SegmentedPill label="Tab A" active onPress={jest.fn()} />);
    const pill = screen.getByRole("tab");
    expect(pill.props.accessibilityState).toEqual({ selected: true });
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<SegmentedPill label="Tab A" active={false} onPress={onPress} />);
    fireEvent.press(screen.getByRole("tab"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a leading icon when provided and passes size 15", () => {
    const Icon = jest.fn(() => null);
    render(
      <SegmentedPill label="With Icon" active onPress={jest.fn()} icon={Icon} />
    );
    // Icon is rendered as a component — assert it received size 15.
    expect(Icon).toHaveBeenCalled();
    const props = Icon.mock.calls[0][0] as { size: number; color: string };
    expect(props.size).toBe(15);
    // active -> icon color is brand.prussian (a defined hex), not undefined.
    expect(typeof props.color).toBe("string");
  });

  it("renders label-only when no icon is given (icon component not invoked)", () => {
    const Icon = jest.fn(() => null);
    render(<SegmentedPill label="No Icon" active={false} onPress={jest.fn()} />);
    expect(Icon).not.toHaveBeenCalled();
    expect(screen.getByText("No Icon")).toBeTruthy();
  });
});
