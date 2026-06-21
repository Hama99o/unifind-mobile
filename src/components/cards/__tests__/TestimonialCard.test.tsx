/**
 * TestimonialCard — render + interaction behaviour.
 *
 * Mocked: reanimated (usePressScale), react-native-svg (GradientView), t=>key.
 * Traced rules:
 *   - title, userName always shown.
 *   - rating shown as `rating.toFixed(1)` next to the stars.
 *   - testimonial falls back to "-" when empty/falsy.
 *   - userProgram row shown only when provided.
 *   - avatar: shows the userName initial (uppercased) when userAvatar is null.
 *   - "knowMore" CTA rendered only when onPress is provided.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { TestimonialCard, type TestimonialCardProps } from "@/components/cards/TestimonialCard";

const baseProps: TestimonialCardProps = {
  imageUrl: "https://example.com/img.jpg",
  title: "Acme University",
  rating: 4.5,
  testimonial: "Best experience of my life.",
  userName: "jordan",
  userAvatar: null,
};

describe("TestimonialCard", () => {
  it("renders the title, testimonial and user name", () => {
    render(<TestimonialCard {...baseProps} />);
    expect(screen.getByText("Acme University")).toBeTruthy();
    expect(screen.getByText("Best experience of my life.")).toBeTruthy();
    expect(screen.getByText("jordan")).toBeTruthy();
  });

  it("renders the rating formatted to one decimal place", () => {
    render(<TestimonialCard {...baseProps} rating={4} />);
    expect(screen.getByText("4.0")).toBeTruthy();
  });

  it("renders the rating value with its decimals", () => {
    render(<TestimonialCard {...baseProps} rating={4.5} />);
    expect(screen.getByText("4.5")).toBeTruthy();
  });

  it("falls back to '-' when the testimonial is empty", () => {
    render(<TestimonialCard {...baseProps} testimonial="" />);
    expect(screen.getByText("-")).toBeTruthy();
  });

  it("renders the user's initial (uppercased) when no avatar is given", () => {
    render(<TestimonialCard {...baseProps} userName="jordan" userAvatar={null} />);
    // "jordan".charAt(0).toUpperCase() => "J"
    expect(screen.getByText("J")).toBeTruthy();
  });

  it("renders the userProgram row when provided", () => {
    render(<TestimonialCard {...baseProps} userProgram="Computer Science" />);
    expect(screen.getByText("Computer Science")).toBeTruthy();
  });

  it("omits the userProgram row when not provided", () => {
    render(<TestimonialCard {...baseProps} />);
    expect(screen.queryByText("Computer Science")).toBeNull();
  });

  it("renders the 'knowMore' CTA only when onPress is provided", () => {
    const { rerender } = render(<TestimonialCard {...baseProps} />);
    expect(screen.queryByText("knowMore")).toBeNull();
    rerender(<TestimonialCard {...baseProps} onPress={jest.fn()} />);
    expect(screen.getByText("knowMore")).toBeTruthy();
  });

  it("fires onPress when the card is pressed", () => {
    const onPress = jest.fn();
    render(<TestimonialCard {...baseProps} onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders without an onPress handler (read-only card) and still mounts", () => {
    const { toJSON } = render(<TestimonialCard {...baseProps} />);
    expect(toJSON()).toBeTruthy();
  });
});
