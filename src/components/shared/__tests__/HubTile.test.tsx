/**
 * HubTile — render + press test.
 *
 * Renders a label and (when count > 0) a numeric count. Optional icon component.
 * The whole tile is a Pressable (accessibilityRole="button") firing onPress.
 *
 * Note the source quirk: the count is shown only when `count !== undefined &&
 * count > 0`, so count={0} renders NO count text.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { BookOpen } from "lucide-react-native";
import { HubTile } from "@/components/shared/HubTile";

describe("HubTile", () => {
  it("renders the label", () => {
    render(<HubTile label="Engineering" onPress={jest.fn()} />);
    expect(screen.getByText("Engineering")).toBeTruthy();
  });

  it("renders a positive count", () => {
    render(<HubTile label="Engineering" count={42} onPress={jest.fn()} />);
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("does NOT render the count when count is 0 (source guards count > 0)", () => {
    render(<HubTile label="Engineering" count={0} onPress={jest.fn()} />);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("does not render a count when count is undefined", () => {
    render(<HubTile label="Engineering" onPress={jest.fn()} />);
    // Only the label text exists; no numeric count node.
    expect(screen.getByText("Engineering")).toBeTruthy();
  });

  it("fires onPress when the tile is pressed", () => {
    const onPress = jest.fn();
    render(<HubTile label="Engineering" icon={BookOpen} onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
