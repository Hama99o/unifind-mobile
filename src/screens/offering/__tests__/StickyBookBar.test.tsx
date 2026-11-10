import { render, screen, fireEvent } from "@testing-library/react-native";
import { StickyBookBar } from "@/screens/offering/StickyBookBar";

describe("StickyBookBar (DESIGN-01)", () => {
  it("shows the starting price and books", () => {
    const onBook = jest.fn();
    render(<StickyBookBar fromPrice={45} onBook={onBook} />);
    expect(screen.getByText("from")).toBeTruthy();
    fireEvent.press(screen.getByTestId("sticky-book-seat"));
    expect(onBook).toHaveBeenCalled();
  });

  it("hides the price when unknown", () => {
    render(<StickyBookBar fromPrice={null} onBook={jest.fn()} />);
    expect(screen.queryByText("from")).toBeNull();
    expect(screen.getByTestId("sticky-book-seat")).toBeTruthy();
  });
});
