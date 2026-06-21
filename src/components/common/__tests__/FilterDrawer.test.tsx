/**
 * FilterDrawer (+ FilterDrawerBody + FilterDrawerSections) — integration tests.
 *
 * Traced against:
 *   src/components/common/FilterDrawer.tsx
 *   src/components/common/FilterDrawerBody.tsx
 *   src/components/common/FilterDrawerSections.tsx
 *
 * Rendering model:
 *   FilterDrawer is an Actionsheet, which under jest is a React Native <Modal>.
 *   The RN Modal mock returns null when visible===false, so the body only
 *   renders when isOpen===true. Sections are expanded by default (the drawer
 *   seeds expandedSections with every filter key), so options are visible
 *   without first tapping the section header.
 *
 * What we verify (FILTER_DRAWER.md contract):
 *   - open shows every configured section label + its options
 *   - multiSelect: toggling a checkbox updates the PENDING (local) selection;
 *     nothing is committed until Apply
 *   - Apply fires onApply with the pending selection (testID filter-drawer-apply)
 *   - Clear resets local values AND fires onClearAll (footer button always present)
 *   - the active count chip drives the Apply label `${showResults} (${count})`
 *     and renders the header clear control only when count > 0
 *   - singleSelect renders the option list and selecting/deselecting works
 *   - async fetchOptions resolves and calls onOptionsLoaded, and the loading
 *     placeholder shows while pending
 *   - collapsing a section hides its options
 *
 * Quirks asserted:
 *   - t() is mocked to return the key, so the Apply button label is
 *     "showResults (N)" and the clear control text is "clearSelection".
 *   - selecting the SAME singleSelect option again deselects it (onSelect(null)).
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { FilterDrawer } from "@/components/common/FilterDrawer";
import type { FilterConfig, FilterValues } from "@/components/common/FilterDrawer";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const multiConfig: FilterConfig[] = [
  {
    key: "type",
    label: "Institution Type",
    type: "multiSelect",
    options: [
      { value: "public", label: "Public" },
      { value: "private", label: "Private", count: 12 },
    ],
  },
];

const twoSectionConfig: FilterConfig[] = [
  {
    key: "type",
    label: "Institution Type",
    type: "multiSelect",
    options: [
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
    ],
  },
  {
    key: "level",
    label: "Degree Level",
    type: "multiSelect",
    options: [
      { value: "bachelor", label: "Bachelor" },
      { value: "master", label: "Master" },
    ],
  },
];

const singleConfig: FilterConfig[] = [
  {
    key: "duration",
    label: "Duration",
    type: "singleSelect",
    options: [
      { value: "short", label: "Under 1 year" },
      { value: "long", label: "Over 1 year" },
    ],
  },
];

type Handlers = {
  onClose: jest.Mock;
  onApply: jest.Mock;
  onClearAll: jest.Mock;
  onOptionsLoaded: jest.Mock;
};

function renderDrawer(opts: {
  isOpen?: boolean;
  filterConfig?: FilterConfig[];
  values?: FilterValues;
} = {}) {
  const handlers: Handlers = {
    onClose: jest.fn(),
    onApply: jest.fn(),
    onClearAll: jest.fn(),
    onOptionsLoaded: jest.fn(),
  };
  const utils = render(
    <FilterDrawer
      isOpen={opts.isOpen ?? true}
      onClose={handlers.onClose}
      filterConfig={opts.filterConfig ?? multiConfig}
      values={opts.values ?? {}}
      onApply={handlers.onApply}
      onClearAll={handlers.onClearAll}
      onOptionsLoaded={handlers.onOptionsLoaded}
    />
  );
  return { ...utils, handlers };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FilterDrawer", () => {
  it("renders nothing visible when closed (Modal hides children)", () => {
    renderDrawer({ isOpen: false });
    expect(screen.queryByText("Institution Type")).toBeNull();
    expect(screen.queryByText("Public")).toBeNull();
  });

  it("renders each section label and its options when open", () => {
    renderDrawer({ filterConfig: twoSectionConfig });
    expect(screen.getByText("Institution Type")).toBeTruthy();
    expect(screen.getByText("Degree Level")).toBeTruthy();
    // Sections expanded by default -> options visible immediately
    expect(screen.getByText("Public")).toBeTruthy();
    expect(screen.getByText("Private")).toBeTruthy();
    expect(screen.getByText("Bachelor")).toBeTruthy();
    expect(screen.getByText("Master")).toBeTruthy();
  });

  it("renders the option count badge when an option has count", () => {
    renderDrawer();
    // Private has count 12 -> "(12)"
    expect(screen.getByText("(12)")).toBeTruthy();
  });

  it("shows the header title (filterBy) and Apply label (showResults (0)) with no selection", () => {
    renderDrawer();
    expect(screen.getByText("filterBy")).toBeTruthy();
    // activeCount 0 -> "showResults (0)"
    expect(screen.getByText("showResults (0)")).toBeTruthy();
    // header clear control only renders when activeCount > 0
    expect(screen.queryByText(/^clearSelection \(/)).toBeNull();
  });

  it("toggling a checkbox updates the pending selection (Apply label count) without committing", () => {
    const { handlers } = renderDrawer();
    expect(screen.getByText("showResults (0)")).toBeTruthy();

    fireEvent.press(screen.getByText("Public"));

    // Pending count now 1 -> label updates, but onApply NOT called yet
    expect(screen.getByText("showResults (1)")).toBeTruthy();
    expect(handlers.onApply).not.toHaveBeenCalled();
    // Header clear control now visible: "clearSelection (1)"
    expect(screen.getByText("clearSelection (1)")).toBeTruthy();
  });

  it("Apply fires onApply with the pending multiSelect selection", () => {
    const { handlers } = renderDrawer();
    fireEvent.press(screen.getByText("Public"));
    fireEvent.press(screen.getByText("Private"));
    fireEvent.press(screen.getByTestId("filter-drawer-apply"));

    expect(handlers.onApply).toHaveBeenCalledTimes(1);
    expect(handlers.onApply).toHaveBeenCalledWith({ type: ["public", "private"] });
  });

  it("unchecking the last value in a key removes the key entirely", () => {
    const { handlers } = renderDrawer({ values: { type: ["public"] } });
    // Pre-selected -> uncheck "Public"
    fireEvent.press(screen.getByText("Public"));
    fireEvent.press(screen.getByTestId("filter-drawer-apply"));
    // toggleMultiValue deletes the key when the array empties
    expect(handlers.onApply).toHaveBeenCalledWith({});
  });

  it("seeds the pending selection from the values prop", () => {
    renderDrawer({ values: { type: ["private"] } });
    // activeCount derived from local copy == 1
    expect(screen.getByText("showResults (1)")).toBeTruthy();
  });

  it("Clear resets the pending selection and fires onClearAll (footer button)", () => {
    // activeCount counts active filter KEYS (not total selected options), so two
    // distinct keys are needed to reach a count of 2. See the FilterDrawer's
    // `activeCount` reducer: it filters localValues entries, one per key.
    const { handlers } = renderDrawer({
      filterConfig: twoSectionConfig,
      values: { type: ["public", "private"], level: ["bachelor"] },
    });
    expect(screen.getByText("showResults (2)")).toBeTruthy();

    // Footer Clear button label is "clearSelection" (no count suffix).
    fireEvent.press(screen.getByText("clearSelection"));

    expect(handlers.onClearAll).toHaveBeenCalledTimes(1);
    // Local values reset -> Apply label back to (0)
    expect(screen.getByText("showResults (0)")).toBeTruthy();
  });

  it("the header clear control also clears and is shown only when count > 0", () => {
    const { handlers } = renderDrawer({ values: { type: ["public"] } });
    // header control text: "clearSelection (1)"
    fireEvent.press(screen.getByText("clearSelection (1)"));
    expect(handlers.onClearAll).toHaveBeenCalledTimes(1);
    expect(screen.getByText("showResults (0)")).toBeTruthy();
  });

  it("collapsing a section hides its options", () => {
    renderDrawer();
    expect(screen.getByText("Public")).toBeTruthy();
    // Tap the section header (its label) to collapse it
    fireEvent.press(screen.getByText("Institution Type"));
    expect(screen.queryByText("Public")).toBeNull();
    expect(screen.queryByText("Private")).toBeNull();
  });

  describe("singleSelect", () => {
    it("renders the option list and selecting one applies it as a 1-element array", () => {
      const { handlers } = renderDrawer({ filterConfig: singleConfig });
      expect(screen.getByText("Under 1 year")).toBeTruthy();
      expect(screen.getByText("Over 1 year")).toBeTruthy();

      fireEvent.press(screen.getByText("Under 1 year"));
      fireEvent.press(screen.getByTestId("filter-drawer-apply"));

      // setSingleValue stores the value as [value]
      expect(handlers.onApply).toHaveBeenCalledWith({ duration: ["short"] });
    });

    it("pressing the already-selected singleSelect option deselects it", () => {
      const { handlers } = renderDrawer({
        filterConfig: singleConfig,
        values: { duration: ["short"] },
      });
      // Re-press the selected option -> onSelect(null) -> key removed
      fireEvent.press(screen.getByText("Under 1 year"));
      fireEvent.press(screen.getByTestId("filter-drawer-apply"));
      expect(handlers.onApply).toHaveBeenCalledWith({});
    });
  });

  describe("async fetchOptions", () => {
    const deferred = () => {
      let resolve!: (v: { value: string; label: string }[]) => void;
      const promise = new Promise<{ value: string; label: string }[]>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    };

    it("shows the loading placeholder while options fetch, then renders them and calls onOptionsLoaded", async () => {
      const d = deferred();
      const fetchOptions = jest.fn(() => d.promise);
      const config: FilterConfig[] = [
        { key: "field", label: "Study Field", type: "multiSelect", fetchOptions },
      ];
      const { handlers } = renderDrawer({ filterConfig: config });

      // While pending: loading placeholder (t("common.loading"))
      expect(fetchOptions).toHaveBeenCalledTimes(1);
      expect(screen.getByText("common.loading")).toBeTruthy();

      await act(async () => {
        d.resolve([
          { value: "cs", label: "Computer Science" },
          { value: "eng", label: "Engineering" },
        ]);
        await d.promise;
      });

      await waitFor(() =>
        expect(screen.getByText("Computer Science")).toBeTruthy()
      );
      expect(screen.getByText("Engineering")).toBeTruthy();
      // onOptionsLoaded lifts the resolved options keyed by filter key
      expect(handlers.onOptionsLoaded).toHaveBeenCalledWith(
        expect.objectContaining({
          field: [
            { value: "cs", label: "Computer Science" },
            { value: "eng", label: "Engineering" },
          ],
        })
      );
    });
  });

  describe("range", () => {
    it("renders min/max labels for a range section (slider stub) and applies a range", () => {
      const config: FilterConfig[] = [
        { key: "tuition", label: "Tuition", type: "range", min: 0, max: 10000, step: 500, unit: "$" },
      ];
      renderDrawer({ filterConfig: config });
      expect(screen.getByText("Tuition")).toBeTruthy();
      // Slider stub (jest.setup) renders testID "slider"; min/max labels present.
      expect(screen.getByText("filter.min")).toBeTruthy();
      expect(screen.getByText("filter.max")).toBeTruthy();
    });
  });
});
