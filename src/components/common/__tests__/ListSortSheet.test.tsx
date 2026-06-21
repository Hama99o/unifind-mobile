/**
 * ListSortSheet — render + interaction tests.
 *
 * Source: src/components/common/ListSortSheet.tsx
 *
 * Behaviour traced from source:
 * - Wraps a Gluestack Actionsheet (a plain RN <Modal visible={isOpen}>). When open it
 *   renders a heading t("titleSortBy") and one ActionsheetItem per sort option,
 *   each showing opt.label.
 * - The item whose key === currentSort is rendered with isSelected (and shows a check).
 * - Pressing an item calls onSelect(opt.key).
 * - Pressing the backdrop calls onClose.
 *
 * Note: Actionsheet is a RN Modal; the test renderer mounts Modal children
 * regardless of `visible`, so we assert behaviour with isOpen=true.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { ListSortSheet } from "@/components/common/ListSortSheet";
import type { SortOption } from "@/components/common/UniversalListTypes";

const sortOptions: SortOption[] = [
  { key: "name_asc", label: "Name (A–Z)" },
  { key: "name_desc", label: "Name (Z–A)" },
  { key: "rating", label: "Top Rated" },
];

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  sortOptions,
  currentSort: "name_asc",
  onSelect: jest.fn(),
};

describe("ListSortSheet", () => {
  it("renders the sort heading (mocked t key)", () => {
    render(<ListSortSheet {...baseProps} />);
    expect(screen.getByText("titleSortBy")).toBeTruthy();
  });

  it("renders one row per sort option", () => {
    render(<ListSortSheet {...baseProps} />);
    expect(screen.getByText("Name (A–Z)")).toBeTruthy();
    expect(screen.getByText("Name (Z–A)")).toBeTruthy();
    expect(screen.getByText("Top Rated")).toBeTruthy();
  });

  it("calls onSelect with the option key when a row is pressed", () => {
    const onSelect = jest.fn();
    render(<ListSortSheet {...baseProps} onSelect={onSelect} />);
    fireEvent.press(screen.getByText("Top Rated"));
    expect(onSelect).toHaveBeenCalledWith("rating");
  });

  it("can select the currently-selected option again (fires onSelect with same key)", () => {
    const onSelect = jest.fn();
    render(<ListSortSheet {...baseProps} currentSort="name_asc" onSelect={onSelect} />);
    fireEvent.press(screen.getByText("Name (A–Z)"));
    expect(onSelect).toHaveBeenCalledWith("name_asc");
  });

  it("renders no option rows when sortOptions is empty (heading still present)", () => {
    render(<ListSortSheet {...baseProps} sortOptions={[]} />);
    expect(screen.getByText("titleSortBy")).toBeTruthy();
    expect(screen.queryByText("Top Rated")).toBeNull();
  });
});
