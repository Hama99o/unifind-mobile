/**
 * SubNavBar — render + interaction tests.
 *
 * Source: src/components/common/SubNavBar.tsx
 *
 * Behaviour traced from source:
 * - Renders 3 tabs: programs / institutions / offerings, each with testID
 *   `subnav-tab-<key>` and label t(labelKey) — note offerings uses labelKey "offering".
 * - Each tab is accessibilityRole="tab" with accessibilityState.selected reflecting
 *   the active tab.
 * - Pressing a tab fires onTabPress(tab.key).
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { SubNavBar } from "@/components/common/SubNavBar";

describe("SubNavBar", () => {
  it("renders all three tabs", () => {
    render(<SubNavBar activeTab="programs" onTabPress={jest.fn()} />);
    expect(screen.getByTestId("subnav-tab-programs")).toBeTruthy();
    expect(screen.getByTestId("subnav-tab-institutions")).toBeTruthy();
    expect(screen.getByTestId("subnav-tab-offerings")).toBeTruthy();
  });

  it("renders the translated labels (mocked t returns the key; offerings -> 'offering')", () => {
    render(<SubNavBar activeTab="programs" onTabPress={jest.fn()} />);
    // labels are rendered as Text children; the accessibilityLabel uses the same keys
    expect(screen.getByText("programs")).toBeTruthy();
    expect(screen.getByText("institutions")).toBeTruthy();
    expect(screen.getByText("offering")).toBeTruthy();
  });

  it("marks the active tab selected and others not selected", () => {
    render(<SubNavBar activeTab="institutions" onTabPress={jest.fn()} />);
    expect(
      screen.getByTestId("subnav-tab-institutions").props.accessibilityState
    ).toEqual({ selected: true });
    expect(
      screen.getByTestId("subnav-tab-programs").props.accessibilityState
    ).toEqual({ selected: false });
  });

  it("fires onTabPress with the tab key when a tab is pressed", () => {
    const onTabPress = jest.fn();
    render(<SubNavBar activeTab="programs" onTabPress={onTabPress} />);
    fireEvent.press(screen.getByTestId("subnav-tab-institutions"));
    expect(onTabPress).toHaveBeenCalledWith("institutions");
  });

  it("fires onTabPress with 'offerings' when the offerings tab is pressed", () => {
    const onTabPress = jest.fn();
    render(<SubNavBar activeTab="programs" onTabPress={onTabPress} />);
    fireEvent.press(screen.getByTestId("subnav-tab-offerings"));
    expect(onTabPress).toHaveBeenCalledWith("offerings");
  });
});
