/**
 * QA 2026-11-10: typing in a sheet (country search, filter min/max) hid the
 * whole sheet behind the keyboard — Android edge-to-edge does not resize the
 * Modal. ActionsheetContent must sit on top of the keyboard.
 */
import { render, screen, act } from "@testing-library/react-native";
import { Keyboard, StyleSheet, Text } from "react-native";
import { ActionsheetContent } from "@/components/ui/actionsheet";

describe("ActionsheetContent above the keyboard", () => {
  const handlers: Record<string, (e?: unknown) => void> = {};
  beforeEach(() => {
    jest.spyOn(Keyboard, "addListener").mockImplementation(((evt: string, cb: (e?: unknown) => void) => {
      handlers[evt] = cb;
      return { remove: jest.fn() };
    }) as never);
  });

  const style = () => StyleSheet.flatten(screen.getByTestId("sheet").props.style) ?? {};

  it("sits at the bottom with no keyboard", () => {
    render(<ActionsheetContent testID="sheet"><Text>x</Text></ActionsheetContent>);
    expect(style().bottom ?? 0).toBe(0);
  });

  it("is lifted by the keyboard height while the keyboard is shown, and drops back after", () => {
    render(<ActionsheetContent testID="sheet"><Text>x</Text></ActionsheetContent>);
    act(() => handlers.keyboardDidShow({ endCoordinates: { height: 320 } }));
    expect(style().bottom).toBe(320);
    expect(typeof style().maxHeight).toBe("number");
    act(() => handlers.keyboardDidHide());
    expect(style().bottom ?? 0).toBe(0);
  });
});
