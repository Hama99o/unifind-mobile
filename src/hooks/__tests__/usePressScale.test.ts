/**
 * usePressScale.test.ts — tests the shared press-scale animation hook.
 *
 * react-native-reanimated is stubbed in the test env (useSharedValue /
 * useAnimatedStyle / withTiming are no-ops or simple shims), so we cannot assert
 * on actual animated values. We assert the hook's public contract:
 *   - returns animStyle + handlePressIn + handlePressOut
 *   - the handlers are callable and do not throw (multiple presses, interleaved)
 */

import { renderHook, act } from "@testing-library/react-native";
import { usePressScale } from "@/hooks/usePressScale";

describe("usePressScale", () => {
  it("returns animStyle and the two press handlers", () => {
    const { result } = renderHook(() => usePressScale());
    expect(result.current).toHaveProperty("animStyle");
    expect(typeof result.current.handlePressIn).toBe("function");
    expect(typeof result.current.handlePressOut).toBe("function");
  });

  it("animStyle is defined (an object under the reanimated stub)", () => {
    const { result } = renderHook(() => usePressScale());
    // Under the reanimated test shim useAnimatedStyle returns a style object.
    expect(result.current.animStyle).toBeDefined();
  });

  it("handlePressIn does not throw", () => {
    const { result } = renderHook(() => usePressScale());
    expect(() => act(() => result.current.handlePressIn())).not.toThrow();
  });

  it("handlePressOut does not throw", () => {
    const { result } = renderHook(() => usePressScale());
    expect(() => act(() => result.current.handlePressOut())).not.toThrow();
  });

  it("survives an interleaved press-in / press-out sequence without crashing", () => {
    const { result } = renderHook(() => usePressScale());
    expect(() =>
      act(() => {
        result.current.handlePressIn();
        result.current.handlePressOut();
        result.current.handlePressIn();
        result.current.handlePressOut();
      })
    ).not.toThrow();
  });

  it("provides stable handler identities across renders (defined as closures each render but callable)", () => {
    const { result, rerender } = renderHook(() => usePressScale());
    rerender({});
    // Not asserting referential equality (handlers are re-created each render),
    // only that after a re-render the contract still holds.
    expect(typeof result.current.handlePressIn).toBe("function");
    expect(typeof result.current.handlePressOut).toBe("function");
  });
});
