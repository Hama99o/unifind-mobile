import { renderHook, act } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

describe("useKeyboardVisible", () => {
  it("is true between keyboardDidShow and keyboardDidHide, and unsubscribes on unmount", () => {
    const handlers: Record<string, () => void> = {};
    const remove = jest.fn();
    jest.spyOn(Keyboard, "addListener").mockImplementation(((evt: string, cb: () => void) => {
      handlers[evt] = cb;
      return { remove };
    }) as never);

    const { result, unmount } = renderHook(() => useKeyboardVisible());
    expect(result.current).toBe(false);
    act(() => handlers.keyboardDidShow());
    expect(result.current).toBe(true);
    act(() => handlers.keyboardDidHide());
    expect(result.current).toBe(false);
    unmount();
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
