import { renderHook, act } from "@testing-library/react-native";
import { useScrollToSection } from "@/hooks/useScrollToSection";

const layout = (y: number) => ({ nativeEvent: { layout: { x: 0, y, width: 0, height: 0 } } }) as never;

describe("useScrollToSection (offering Book a Seat)", () => {
  it("scrolls to the section's position in the scroll content (parent offset + own offset)", () => {
    const { result } = renderHook(() => useScrollToSection(16));
    const scrollTo = jest.fn();
    (result.current.scrollRef as { current: unknown }).current = { scrollTo };
    act(() => {
      result.current.onParentLayout(layout(600)); // wrapper below the hero
      result.current.onSectionLayout(layout(900)); // section inside the wrapper
    });
    result.current.scrollToSection();
    expect(scrollTo).toHaveBeenCalledWith({ y: 600 + 900 - 16, animated: true });
  });

  it("does nothing before the section is laid out", () => {
    const { result } = renderHook(() => useScrollToSection());
    const scrollTo = jest.fn();
    (result.current.scrollRef as { current: unknown }).current = { scrollTo };
    result.current.scrollToSection();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
