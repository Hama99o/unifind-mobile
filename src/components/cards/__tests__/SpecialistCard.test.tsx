/**
 * SpecialistCard — render + interaction behaviour.
 *
 * Mocked t(key) => key, so the button reads "bookNow" / "selected" and the
 * heart a11y label reads "addToFavorite" / "removeFavorite".
 * The whole card is a Pressable (role=button) AND there's a separate book
 * Button (testID specialist-book-session) — both call onSelect. The heart
 * Pressable calls onToggleFavorite (and stops propagation).
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { SpecialistCard, type SpecialistCardProps } from "@/components/cards/SpecialistCard";
import type { NodeOfferingSpecialist } from "@/api/nodeOfferingApi";

const specialist: NodeOfferingSpecialist = {
  _id: "spec-1",
  name: "Dr. Alice",
  headline: "Math Tutor",
  bio: "Ten years of experience teaching calculus.",
  avatar: null,
};

function setup(overrides: Partial<SpecialistCardProps> = {}) {
  const props: SpecialistCardProps = {
    specialist,
    isSelected: false,
    onSelect: jest.fn(),
    ...overrides,
  };
  render(<SpecialistCard {...props} />);
  return props;
}

describe("SpecialistCard", () => {
  it("renders the specialist name, headline and bio", () => {
    setup();
    expect(screen.getByText("Dr. Alice")).toBeTruthy();
    expect(screen.getByText("Math Tutor")).toBeTruthy();
    expect(screen.getByText("Ten years of experience teaching calculus.")).toBeTruthy();
  });

  it("omits the headline row when headline is absent", () => {
    setup({ specialist: { _id: "s", name: "No Headline" } });
    expect(screen.getByText("No Headline")).toBeTruthy();
    expect(screen.queryByText("Math Tutor")).toBeNull();
  });

  it("omits the bio row when bio is absent", () => {
    setup({ specialist: { _id: "s", name: "No Bio", headline: "Tutor" } });
    expect(screen.queryByText("Ten years of experience teaching calculus.")).toBeNull();
  });

  it("shows the 'bookNow' label when not selected", () => {
    setup({ isSelected: false });
    expect(screen.getByText("bookNow")).toBeTruthy();
    expect(screen.queryByText("selected")).toBeNull();
  });

  it("shows the 'selected' label when selected", () => {
    setup({ isSelected: true });
    expect(screen.getByText("selected")).toBeTruthy();
    expect(screen.queryByText("bookNow")).toBeNull();
  });

  it("fires onSelect when the Book button is pressed", () => {
    const onSelect = jest.fn();
    setup({ onSelect });
    fireEvent.press(screen.getByTestId("specialist-book-session"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not render the favorite heart when onToggleFavorite is absent", () => {
    setup();
    // Only the card Pressable carries role=button when no heart is present.
    expect(screen.queryByLabelText("addToFavorite")).toBeNull();
    expect(screen.queryByLabelText("removeFavorite")).toBeNull();
  });

  it("renders the heart with 'addToFavorite' label and fires onToggleFavorite", () => {
    const onToggleFavorite = jest.fn();
    setup({ onToggleFavorite, isFavorite: false });
    const heart = screen.getByLabelText("addToFavorite");
    // The heart's onPress reads the event (e.stopPropagation), so pass a
    // synthetic event — fireEvent.press otherwise sends `undefined`.
    fireEvent.press(heart, { stopPropagation: jest.fn() });
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it("renders the heart with 'removeFavorite' label when already a favorite", () => {
    setup({ onToggleFavorite: jest.fn(), isFavorite: true });
    expect(screen.getByLabelText("removeFavorite")).toBeTruthy();
  });

  it("reflects selected state via accessibilityState on the card", () => {
    setup({ isSelected: true });
    // The card Pressable carries accessibilityState={{ selected: true }}.
    const selectedNodes = screen.getAllByRole("button").filter(
      (n) => (n.props as { accessibilityState?: { selected?: boolean } }).accessibilityState?.selected === true
    );
    expect(selectedNodes.length).toBeGreaterThanOrEqual(1);
  });
});
