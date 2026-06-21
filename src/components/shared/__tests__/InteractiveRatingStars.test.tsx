/**
 * InteractiveRatingStars — tappable star rating input.
 *
 * Traced behaviour (src/components/shared/InteractiveRatingStars.tsx):
 *   - Renders `max` star Pressables (default 5), each accessibilityRole="button".
 *   - Tapping the star at index i calls onChange(i + 1).
 *   - `value` only controls fill colour (cannot assert colours under jest), so
 *     we assert behaviour via the number of pressable buttons + the onChange arg.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { InteractiveRatingStars } from "@/components/shared/InteractiveRatingStars";

describe("InteractiveRatingStars", () => {
  it("renders 5 star buttons by default", () => {
    render(<InteractiveRatingStars value={0} onChange={jest.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("renders `max` star buttons when max is overridden", () => {
    render(<InteractiveRatingStars value={0} onChange={jest.fn()} max={3} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("calls onChange(1) when the first star is tapped", () => {
    const onChange = jest.fn();
    render(<InteractiveRatingStars value={0} onChange={onChange} />);
    fireEvent.press(screen.getAllByRole("button")[0]);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("calls onChange(N) when the Nth star (index N-1) is tapped", () => {
    const onChange = jest.fn();
    render(<InteractiveRatingStars value={0} onChange={onChange} />);
    const stars = screen.getAllByRole("button");
    fireEvent.press(stars[4]); // 5th star
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("calls onChange with the tapped value each time (independent taps)", () => {
    const onChange = jest.fn();
    render(<InteractiveRatingStars value={0} onChange={onChange} />);
    const stars = screen.getAllByRole("button");
    fireEvent.press(stars[2]); // -> 3
    fireEvent.press(stars[0]); // -> 1
    expect(onChange).toHaveBeenNthCalledWith(1, 3);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);
  });

  it("each star is pressable independently across the full range", () => {
    const onChange = jest.fn();
    render(<InteractiveRatingStars value={0} onChange={onChange} />);
    const stars = screen.getAllByRole("button");
    stars.forEach((s) => fireEvent.press(s));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([1, 2, 3, 4, 5]);
  });

  it("renders without crashing when isInvalid is true", () => {
    render(<InteractiveRatingStars value={2} onChange={jest.fn()} isInvalid />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });
});
