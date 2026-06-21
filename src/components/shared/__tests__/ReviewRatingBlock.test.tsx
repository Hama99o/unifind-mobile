/**
 * ReviewRatingBlock — labeled rating row (label + InteractiveRatingStars + error).
 *
 * Traced behaviour (src/components/shared/ReviewRatingBlock.tsx):
 *   - Label text is `${label}${required ? " *" : ""}` (required defaults to true).
 *   - Renders InteractiveRatingStars (5 button-role stars) that forward onChange.
 *   - errorMessage Text is rendered ONLY when isInvalid is true.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { ReviewRatingBlock } from "@/components/shared/ReviewRatingBlock";

describe("ReviewRatingBlock", () => {
  const baseProps = {
    label: "Quality",
    value: 0,
    onChange: jest.fn(),
    isInvalid: false,
    errorMessage: "ratingRequired",
  };

  it("renders the label with a trailing ' *' when required (default)", () => {
    render(<ReviewRatingBlock {...baseProps} />);
    expect(screen.getByText("Quality *")).toBeTruthy();
  });

  it("renders the label without ' *' when required is false", () => {
    render(<ReviewRatingBlock {...baseProps} required={false} />);
    expect(screen.getByText("Quality")).toBeTruthy();
    expect(screen.queryByText("Quality *")).toBeNull();
  });

  it("renders the 5 interactive stars", () => {
    render(<ReviewRatingBlock {...baseProps} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("does NOT show the error message when isInvalid is false", () => {
    render(<ReviewRatingBlock {...baseProps} isInvalid={false} />);
    expect(screen.queryByText("ratingRequired")).toBeNull();
  });

  it("shows the error message when isInvalid is true", () => {
    render(<ReviewRatingBlock {...baseProps} isInvalid errorMessage="ratingRequired" />);
    expect(screen.getByText("ratingRequired")).toBeTruthy();
  });

  it("forwards star taps to onChange with the 1-based rating", () => {
    const onChange = jest.fn();
    render(<ReviewRatingBlock {...baseProps} onChange={onChange} />);
    fireEvent.press(screen.getAllByRole("button")[3]); // 4th star
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
