import { render, act } from "@testing-library/react-native";
import { Keyboard, ScrollView } from "react-native";
import { KeyboardSafeScrollView } from "@/components/shared/KeyboardSafeScrollView";

describe("KeyboardSafeScrollView (BUG-13)", () => {
  it("adds the keyboard height as bottom padding while the keyboard is open", () => {
    const listeners: Record<string, (e: { endCoordinates: { height: number } }) => void> = {};
    jest.spyOn(Keyboard, "addListener").mockImplementation(((evt: string, cb: never) => {
      listeners[evt] = cb;
      return { remove: jest.fn() };
    }) as never);
    const { UNSAFE_getByType } = render(<KeyboardSafeScrollView contentContainerStyle={{ paddingBottom: 10 }} />);
    const pad = () => (UNSAFE_getByType(ScrollView).props.contentContainerStyle as object[]).slice(-1)[0];
    expect(pad()).toEqual({ paddingBottom: 10 });
    const show = listeners.keyboardWillShow ?? listeners.keyboardDidShow;
    const hide = listeners.keyboardWillHide ?? listeners.keyboardDidHide;
    act(() => show({ endCoordinates: { height: 300, screenY: 1500 } } as never));
    expect(pad()).toEqual({ paddingBottom: 310 });
    act(() => hide({ endCoordinates: { height: 0 } }));
    expect(pad()).toEqual({ paddingBottom: 10 });
  });
});
