/**
 * FeaturedCard — render + interaction behaviour.
 *
 * Mocked: reanimated (usePressScale), react-native-svg (GradientView), t=>key.
 * Traced rules:
 *   - badge, title, description always shown.
 *   - "knowMore" CTA always rendered (no onPress gate, unlike TestimonialCard).
 *   - categoryLabel chip shown only when categoryLabel provided; the category
 *     icon is resolved from categoryIcon (falls back to Tag when unknown/empty),
 *     which must not crash.
 *   - subLine shown only when provided.
 *   - onPress fires from the card Pressable (role=button).
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { FeaturedCard, type FeaturedCardProps } from "@/components/cards/FeaturedCard";

const baseProps: FeaturedCardProps = {
  imageUrl: "https://example.com/img.jpg",
  title: "Premium IELTS Bootcamp",
  description: "Intensive prep for the IELTS exam.",
  badge: "Featured",
};

describe("FeaturedCard", () => {
  it("renders the badge, title and description", () => {
    render(<FeaturedCard {...baseProps} />);
    expect(screen.getByText("Featured")).toBeTruthy();
    expect(screen.getByText("Premium IELTS Bootcamp")).toBeTruthy();
    expect(screen.getByText("Intensive prep for the IELTS exam.")).toBeTruthy();
  });

  it("always renders the 'knowMore' CTA", () => {
    render(<FeaturedCard {...baseProps} />);
    expect(screen.getByText("knowMore")).toBeTruthy();
  });

  it("renders the category chip when categoryLabel is provided", () => {
    render(<FeaturedCard {...baseProps} categoryLabel="LANGUAGE" categoryIcon="globe" />);
    expect(screen.getByText("LANGUAGE")).toBeTruthy();
  });

  it("omits the category chip when categoryLabel is absent", () => {
    render(<FeaturedCard {...baseProps} />);
    expect(screen.queryByText("LANGUAGE")).toBeNull();
  });

  it("resolves an unknown categoryIcon to the Tag fallback without crashing", () => {
    const { toJSON } = render(
      <FeaturedCard {...baseProps} categoryLabel="MISC" categoryIcon="does-not-exist" />
    );
    expect(screen.getByText("MISC")).toBeTruthy();
    expect(toJSON()).toBeTruthy();
  });

  it("renders with no categoryIcon (uses Tag fallback) without crashing", () => {
    const { toJSON } = render(<FeaturedCard {...baseProps} categoryLabel="MISC" />);
    expect(screen.getByText("MISC")).toBeTruthy();
    expect(toJSON()).toBeTruthy();
  });

  it("renders the subLine when provided", () => {
    render(<FeaturedCard {...baseProps} subLine="Beirut, Lebanon" />);
    expect(screen.getByText("Beirut, Lebanon")).toBeTruthy();
  });

  it("omits the subLine when not provided", () => {
    render(<FeaturedCard {...baseProps} />);
    expect(screen.queryByText("Beirut, Lebanon")).toBeNull();
  });

  it("fires onPress when the card is pressed", () => {
    const onPress = jest.fn();
    render(<FeaturedCard {...baseProps} onPress={onPress} />);
    fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders the logo branch without crashing when logoUrl is provided", () => {
    const { toJSON } = render(
      <FeaturedCard {...baseProps} logoUrl="https://example.com/logo.png" />
    );
    expect(toJSON()).toBeTruthy();
  });
});
