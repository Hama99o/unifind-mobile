/**
 * InstitutionCard — render + interaction smoke/behaviour test.
 *
 * Also serves as the canonical proof that Gluestack/NativeWind UI components
 * render under jest (NativeWind babel transform is disabled in the test env, so
 * `className` is an ignored prop on the underlying RN host components).
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { InstitutionCard } from "@/components/cards/InstitutionCard";

describe("InstitutionCard", () => {
  const baseProps = {
    documentId: "inst-1",
    name: "Acme University",
    type: "Private",
    location: "Beirut, Lebanon",
    description: "A leading institution.",
    fees: "$2,000–$4,000",
    rating: 4,
  };

  it("renders the institution name, type, location and fees", () => {
    render(<InstitutionCard {...baseProps} />);
    expect(screen.getByText("Acme University")).toBeTruthy();
    expect(screen.getByText("Private")).toBeTruthy();
    expect(screen.getByText("Beirut, Lebanon")).toBeTruthy();
    expect(screen.getByText("$2,000–$4,000")).toBeTruthy();
  });

  it("does not render the fees row when fees is '-'", () => {
    render(<InstitutionCard {...baseProps} fees="-" />);
    expect(screen.queryByText("-")).toBeNull();
  });

  it("fires onPrimaryClick and onAddToCompare when the action buttons are pressed", () => {
    const onPrimaryClick = jest.fn();
    const onAddToCompare = jest.fn();
    render(
      <InstitutionCard
        {...baseProps}
        onPrimaryClick={onPrimaryClick}
        onAddToCompare={onAddToCompare}
        primaryLabel="Check Institution"
        compareLabel="Add to Compare"
      />
    );
    fireEvent.press(screen.getByText("Check Institution"));
    fireEvent.press(screen.getByText("Add to Compare"));
    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
    expect(onAddToCompare).toHaveBeenCalledTimes(1);
  });

  it("shows the compared label when isCompared is true", () => {
    render(<InstitutionCard {...baseProps} isCompared onAddToCompare={jest.fn()} />);
    // mocked t() returns the key itself
    expect(screen.getByText("inCompareList")).toBeTruthy();
  });

  it("toggles favourite when the heart is pressed", () => {
    const onToggleFavorite = jest.fn();
    render(<InstitutionCard {...baseProps} onToggleFavorite={onToggleFavorite} isFavorite={false} />);
    // heart Pressable has accessibilityRole="button"; press the first button found via role query
    const buttons = screen.getAllByRole("button");
    fireEvent.press(buttons[0]);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
