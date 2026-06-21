/**
 * HeroDetailCard — render + press test.
 *
 * Renders title, optional subtitle, rating ("X.X/5" only when rating > 0) and a
 * "(N reviews)" line where "reviews" is t("reviews") (mock returns the key).
 * Favorite heart renders only when onToggleFavorite is provided; share button
 * always renders. Up to three action buttons render their labels.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { HeroDetailCard } from "@/components/shared/HeroDetailCard";

describe("HeroDetailCard", () => {
  it("renders title, subtitle, rating and review count", () => {
    render(
      <HeroDetailCard
        title="Acme University"
        subtitle="Beirut, Lebanon"
        rating={4.2}
        nbReviews={37}
      />
    );
    expect(screen.getByText("Acme University")).toBeTruthy();
    expect(screen.getByText("Beirut, Lebanon")).toBeTruthy();
    expect(screen.getByText("4.2/5")).toBeTruthy();
    // "(37 reviews)" — "reviews" comes from the t() mock (key unchanged).
    expect(screen.getByText("(37 reviews)")).toBeTruthy();
  });

  it("omits the X/5 rating text when rating is 0 (default)", () => {
    render(<HeroDetailCard title="No Rating" />);
    expect(screen.getByText("No Rating")).toBeTruthy();
    // rating 0 → the rating text node renders an empty string, so "0.0/5" never appears.
    expect(screen.queryByText("0.0/5")).toBeNull();
    // default nbReviews is 0.
    expect(screen.getByText("(0 reviews)")).toBeTruthy();
  });

  it("does not render a subtitle node when subtitle is omitted", () => {
    render(<HeroDetailCard title="Only Title" />);
    expect(screen.queryByText("Beirut, Lebanon")).toBeNull();
  });

  it("renders and fires the primary action button", () => {
    const onPress = jest.fn();
    render(
      <HeroDetailCard
        title="Acme"
        primaryButton={{ label: "Apply Now", onPress }}
      />
    );
    fireEvent.press(screen.getByText("Apply Now"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders secondary and tertiary action buttons", () => {
    render(
      <HeroDetailCard
        title="Acme"
        primaryButton={{ label: "Primary", onPress: jest.fn() }}
        secondaryButton={{ label: "Compare", onPress: jest.fn() }}
        tertiaryButton={{ label: "Save", onPress: jest.fn() }}
      />
    );
    expect(screen.getByText("Primary")).toBeTruthy();
    expect(screen.getByText("Compare")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("fires onToggleFavorite when the heart button is pressed", () => {
    const onToggleFavorite = jest.fn();
    render(
      <HeroDetailCard
        title="Acme"
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
      />
    );
    // Heart is the first button (share is always second when no favorite).
    const buttons = screen.getAllByRole("button");
    fireEvent.press(buttons[0]);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it("does not render a favorite button when onToggleFavorite is omitted", () => {
    // Only the share button (1 role=button) should be present.
    render(<HeroDetailCard title="Acme" />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
