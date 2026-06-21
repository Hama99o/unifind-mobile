/**
 * CompareBar — render + interaction tests.
 *
 * Source: src/components/common/CompareBar.tsx
 *
 * Behaviour traced from source:
 * - Returns null when the compare count for the itemType is 0 (hidden when empty).
 * - When non-empty, shows "{count}/5 {t('selected')}" -> e.g. "2/5 selected".
 * - "Compare Now" CTA (testID compare-bar-compare-now) navigates via router.push to
 *   `/(main)/compare?tab=institutions` for Institution, `?tab=programs` for Program.
 * - Clear button (testID compare-bar-clear): optimistically clears the local store
 *   (setCompared(type, [])) and fires comparesApi.toggleCompare for every previously
 *   compared id.
 *
 * Uses the real compareStore (Zustand, not mocked) and the globally-mocked nodeApi
 * (so comparesApi.toggleCompare resolves to {data:{}} offline).
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { CompareBar } from "@/components/common/CompareBar";
import { useCompareStore } from "@/stores/compareStore";
import { nodeApi } from "@/api/nodeApi";

beforeEach(() => {
  jest.clearAllMocks();
  // Reset both slots between tests.
  const { setCompared } = useCompareStore.getState();
  setCompared("Program", []);
  setCompared("Institution", []);
});

describe("CompareBar", () => {
  it("renders nothing when the compare cart is empty", () => {
    const { toJSON } = render(<CompareBar itemType="Institution" />);
    expect(toJSON()).toBeNull();
  });

  it("shows the count out of 5 when items are compared", () => {
    useCompareStore.getState().setCompared("Institution", ["i1", "i2"]);
    render(<CompareBar itemType="Institution" />);
    // "{count}/5 {t('selected')}" with mocked t() => "selected"
    expect(screen.getByText("2/5 selected")).toBeTruthy();
  });

  it("renders the Compare Now CTA label (mocked t key)", () => {
    useCompareStore.getState().setCompared("Program", ["p1"]);
    render(<CompareBar itemType="Program" />);
    expect(screen.getByText("compareNow")).toBeTruthy();
    expect(screen.getByTestId("compare-bar-compare-now")).toBeTruthy();
  });

  it("navigates to the institutions compare tab on Compare Now (Institution)", () => {
    useCompareStore.getState().setCompared("Institution", ["i1"]);
    render(<CompareBar itemType="Institution" />);
    fireEvent.press(screen.getByTestId("compare-bar-compare-now"));
    expect(router.push).toHaveBeenCalledWith("/(main)/compare?tab=institutions");
  });

  it("navigates to the programs compare tab on Compare Now (Program)", () => {
    useCompareStore.getState().setCompared("Program", ["p1"]);
    render(<CompareBar itemType="Program" />);
    fireEvent.press(screen.getByTestId("compare-bar-compare-now"));
    expect(router.push).toHaveBeenCalledWith("/(main)/compare?tab=programs");
  });

  it("clear button empties the local store and toggles each id on the server", async () => {
    useCompareStore.getState().setCompared("Program", ["p1", "p2"]);
    render(<CompareBar itemType="Program" />);

    fireEvent.press(screen.getByTestId("compare-bar-clear"));

    // Local store cleared immediately (optimistic).
    expect(useCompareStore.getState().getCount("Program")).toBe(0);

    // Server toggle fired for each previously-compared id.
    await waitFor(() => {
      expect(nodeApi.post).toHaveBeenCalledTimes(2);
    });
    const calls = (nodeApi.post as jest.Mock).mock.calls;
    const bodies = calls.map((c) => c[1]);
    expect(bodies).toEqual(
      expect.arrayContaining([
        { itemID: "p1", itemType: "Program" },
        { itemID: "p2", itemType: "Program" },
      ])
    );
  });
});
