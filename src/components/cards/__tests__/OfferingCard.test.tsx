/**
 * OfferingCard — render + interaction behaviour.
 *
 * Mocked helpers (jest.setup.ts):
 *   - t(key) => key           → assert on translation KEY strings
 *   - formatCurrency(v,"USD") => `$${v.toFixed(2)}`  e.g. 1500 → "$1500.00"
 *   - useColors has no `accent` → RatingStars filled colour is undefined (harmless)
 *
 * Field rules traced from source:
 *   - ctaLabel       = primaryLabel ?? t("favorites.checkOffering")
 *   - durationLabel  shown when sessionDuration != null && !== "-" && !== ""
 *   - priceLabel     shown when price != null && price > 0  → `from $X.00`
 *   - onlineLabel    "yes" if availableOnline===true, "no" if ===false, else hidden
 *   - city chip      shown when city && city !== "-"
 *   - rating stars   shown only when rating > 0
 *   - favorite heart rendered only when onToggleFavorite is provided
 *   - specialist strip shown when specialists.length > 0 (max 2 + "+N")
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { OfferingCard, type OfferingCardProps } from "@/components/cards/OfferingCard";

const baseProps: OfferingCardProps = {
  id: "off-1",
  title: "IELTS Preparation",
};

describe("OfferingCard", () => {
  it("renders the title and the 'offering' badge", () => {
    render(<OfferingCard {...baseProps} />);
    expect(screen.getByText("IELTS Preparation")).toBeTruthy();
    expect(screen.getByText("offering")).toBeTruthy();
  });

  it("uses the default CTA label when primaryLabel is absent", () => {
    render(<OfferingCard {...baseProps} />);
    expect(screen.getByText("favorites.checkOffering")).toBeTruthy();
  });

  it("uses a custom primaryLabel when provided and fires onPrimaryClick", () => {
    const onPrimaryClick = jest.fn();
    render(
      <OfferingCard {...baseProps} primaryLabel="Book Offering" onPrimaryClick={onPrimaryClick} />
    );
    fireEvent.press(screen.getByText("Book Offering"));
    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
  });

  it("renders the description when present", () => {
    render(<OfferingCard {...baseProps} description="A complete IELTS course." />);
    expect(screen.getByText("A complete IELTS course.")).toBeTruthy();
  });

  it("does not render a description block when description is omitted", () => {
    render(<OfferingCard {...baseProps} />);
    expect(screen.queryByText("A complete IELTS course.")).toBeNull();
  });

  it("renders the city chip when city is a real value", () => {
    render(<OfferingCard {...baseProps} city="Beirut" />);
    expect(screen.getByText("Beirut")).toBeTruthy();
  });

  it("hides the city chip when city is '-'", () => {
    render(<OfferingCard {...baseProps} city="-" />);
    expect(screen.queryByText("-")).toBeNull();
  });

  it("renders the price label as 'from $X.00' when price > 0", () => {
    render(<OfferingCard {...baseProps} price={1500} />);
    // mocked formatCurrency(1500,"USD") => "$1500.00"; label => "from $1500.00"
    expect(screen.getByText("from $1500.00")).toBeTruthy();
  });

  it("hides the price label when price is 0", () => {
    render(<OfferingCard {...baseProps} price={0} />);
    expect(screen.queryByText(/from/)).toBeNull();
  });

  it("hides the price label when price is null", () => {
    render(<OfferingCard {...baseProps} price={null} />);
    expect(screen.queryByText(/from/)).toBeNull();
  });

  // When sessionDuration is set the component shows the duration chip preceded by
  // lucide's <Clock/> icon. Clock's glyph uses an SVG `polyline` primitive; the
  // global react-native-svg mock in jest.setup.ts now returns a passthrough host
  // component for ANY primitive (Proxy-based), so the icon renders and this case
  // is enabled. durationLabel = `${sessionDuration} ${t("min")}` → "60 min".
  it("renders the duration label '<n> min' when sessionDuration is set", () => {
    render(<OfferingCard {...baseProps} sessionDuration={60} />);
    // `${60} ${t("min")}` => "60 min"
    expect(screen.getByText("60 min")).toBeTruthy();
  });

  it("hides the duration label when sessionDuration is '-'", () => {
    render(<OfferingCard {...baseProps} sessionDuration="-" />);
    expect(screen.queryByText(/min/)).toBeNull();
  });

  it("hides the duration label when sessionDuration is null", () => {
    render(<OfferingCard {...baseProps} sessionDuration={null} />);
    expect(screen.queryByText(/min/)).toBeNull();
  });

  it("shows the online label as 'yes' when availableOnline is true", () => {
    render(<OfferingCard {...baseProps} availableOnline={true} />);
    // rendered as a single Text: `${t("availableOnline")}: ${t("yes")}`
    expect(screen.getByText("availableOnline: yes")).toBeTruthy();
  });

  it("shows the online label as 'no' when availableOnline is false", () => {
    render(<OfferingCard {...baseProps} availableOnline={false} />);
    expect(screen.getByText("availableOnline: no")).toBeTruthy();
  });

  it("hides the online label when availableOnline is undefined", () => {
    render(<OfferingCard {...baseProps} />);
    expect(screen.queryByText(/availableOnline/)).toBeNull();
  });

  it("renders rating stars only when rating > 0 (no crash; stars present)", () => {
    const { toJSON } = render(<OfferingCard {...baseProps} rating={4} />);
    // The rating block adds 5 Star Svgs; ensure render succeeded with stars.
    const json = JSON.stringify(toJSON());
    expect(json).toContain("Svg");
  });

  it("does not render the favorite heart when onToggleFavorite is absent", () => {
    render(<OfferingCard {...baseProps} />);
    // only button is the CTA (Button uses a Pressable, but no accessibilityRole
    // on Button → the heart Pressable is the only role="button"). With no heart,
    // there are zero role=button elements.
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the favorite heart and fires onToggleFavorite when pressed", () => {
    const onToggleFavorite = jest.fn();
    render(<OfferingCard {...baseProps} onToggleFavorite={onToggleFavorite} />);
    const heart = screen.getByRole("button");
    fireEvent.press(heart);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it("renders a specialist strip with initials and a '+N' overflow badge", () => {
    render(
      <OfferingCard
        {...baseProps}
        specialists={[{ name: "Alice" }, { name: "Bob" }, { name: "Carol" }, { name: "Dan" }]}
      />
    );
    // First two are visible (initials A, B), remaining 2 collapse into "+2".
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
    expect(screen.getByText("+2")).toBeTruthy();
  });

  it("renders no overflow badge when specialists count is <= 2", () => {
    render(<OfferingCard {...baseProps} specialists={[{ name: "Alice" }, { name: "Bob" }]} />);
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it("falls back to '?' initial when a specialist has no name", () => {
    render(<OfferingCard {...baseProps} specialists={[{}]} />);
    expect(screen.getByText("?")).toBeTruthy();
  });
});
