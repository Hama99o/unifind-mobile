/**
 * ListSearchBar — render + interaction tests.
 *
 * Source: src/components/common/ListSearchBar.tsx
 *
 * Behaviour traced from source:
 * - Search input (testID "list-search-input") shows `search` and fires onSearchChange
 *   on text change. Hidden entirely when `searchable === false`.
 * - Filter button (testID "filter-drawer-trigger") renders only when hasFilters; press
 *   fires onOpenFilter. An active-count badge shows when activeFilterCount > 0.
 * - Sort button renders only when hasSortOptions; press fires onOpenSort. It carries
 *   accessibilityLabel t("titleSortBy") (no testID).
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { ListSearchBar } from "@/components/common/ListSearchBar";

const baseProps = {
  search: "",
  onSearchChange: jest.fn(),
  hasFilters: true,
  activeFilterCount: 0,
  hasSortOptions: true,
  onOpenFilter: jest.fn(),
  onOpenSort: jest.fn(),
};

describe("ListSearchBar", () => {
  it("renders the search input with the current value", () => {
    render(<ListSearchBar {...baseProps} search="biology" />);
    const input = screen.getByTestId("list-search-input");
    expect(input).toBeTruthy();
    expect(input.props.value).toBe("biology");
  });

  it("fires onSearchChange when the input text changes", () => {
    const onSearchChange = jest.fn();
    render(<ListSearchBar {...baseProps} onSearchChange={onSearchChange} />);
    fireEvent.changeText(screen.getByTestId("list-search-input"), "chem");
    expect(onSearchChange).toHaveBeenCalledWith("chem");
  });

  it("hides the search input when searchable is false", () => {
    render(<ListSearchBar {...baseProps} searchable={false} />);
    expect(screen.queryByTestId("list-search-input")).toBeNull();
  });

  it("renders the filter button and fires onOpenFilter on press", () => {
    const onOpenFilter = jest.fn();
    render(<ListSearchBar {...baseProps} onOpenFilter={onOpenFilter} />);
    fireEvent.press(screen.getByTestId("filter-drawer-trigger"));
    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });

  it("does not render the filter button when hasFilters is false", () => {
    render(<ListSearchBar {...baseProps} hasFilters={false} />);
    expect(screen.queryByTestId("filter-drawer-trigger")).toBeNull();
  });

  it("shows the active filter count badge when activeFilterCount > 0", () => {
    render(<ListSearchBar {...baseProps} activeFilterCount={3} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("does not show the count badge when activeFilterCount is 0", () => {
    render(<ListSearchBar {...baseProps} activeFilterCount={0} />);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders the sort button and fires onOpenSort on press", () => {
    const onOpenSort = jest.fn();
    render(<ListSearchBar {...baseProps} onOpenSort={onOpenSort} />);
    // Sort button has accessibilityLabel t("titleSortBy") (mocked => key string).
    fireEvent.press(screen.getByLabelText("titleSortBy"));
    expect(onOpenSort).toHaveBeenCalledTimes(1);
  });

  it("does not render the sort button when hasSortOptions is false", () => {
    render(<ListSearchBar {...baseProps} hasSortOptions={false} />);
    expect(screen.queryByLabelText("titleSortBy")).toBeNull();
  });
});
