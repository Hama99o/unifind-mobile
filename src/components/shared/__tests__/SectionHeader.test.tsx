/**
 * SectionHeader — render + "See all" press test.
 *
 * Renders the title via t(titleKey) (mock returns the key). When onSeeAll is
 * provided, a "See all" button (t("seeAll")) is rendered and fires the callback.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { SectionHeader } from "@/components/shared/SectionHeader";

describe("SectionHeader", () => {
  it("renders the title from the translation key", () => {
    render(<SectionHeader titleKey="home.featured" />);
    expect(screen.getByText("home.featured")).toBeTruthy();
  });

  it("does not render the 'See all' affordance when onSeeAll is omitted", () => {
    render(<SectionHeader titleKey="home.featured" />);
    expect(screen.queryByText("seeAll")).toBeNull();
  });

  it("renders 'See all' (seeAll key) and fires onSeeAll when pressed", () => {
    const onSeeAll = jest.fn();
    render(<SectionHeader titleKey="home.featured" onSeeAll={onSeeAll} />);
    const seeAll = screen.getByText("seeAll");
    expect(seeAll).toBeTruthy();
    fireEvent.press(seeAll);
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it("still renders the title in onDark mode", () => {
    render(<SectionHeader titleKey="home.dark" onDark onSeeAll={jest.fn()} />);
    expect(screen.getByText("home.dark")).toBeTruthy();
    expect(screen.getByText("seeAll")).toBeTruthy();
  });
});
