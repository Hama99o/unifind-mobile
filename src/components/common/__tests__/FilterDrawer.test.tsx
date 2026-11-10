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
 *   renders when isOpen===true. All sections start COLLAPSED (web UFFilterAccordion
 *   default expandedSections=[]), so a test taps the section label first.
 *
 * What we verify (FILTER_DRAWER.md contract):
 *   - open shows every configured section label + its options
 *   - multiSelect: toggling a checkbox updates the PENDING (local) selection;
 *     nothing is committed until Apply
 *   - Apply fires onApply with the pending selection (testID filter-drawer-apply)
 *   - header title is btnFilterAndSort; the only footer control is the web's
 *     "Show {{val}} Results" button (no Clear inside the sheet — clearing is the
 *     FilterTags "Clear All Filters" chip, same as web UFLayoutWithSidebar)
 *   - the footer count is the list total formatted with formatNumber
 *   - singleSelect renders the option list and selecting/deselecting works
 *   - async fetchOptions resolves and calls onOptionsLoaded, and the loading
 *     placeholder shows while pending
 *   - collapsing a section hides its options
 *
 * Quirks asserted:
 *   - t() is mocked here to return `key` or `key:val` when interpolated.
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

jest.mock("@/hooks/useCustomTranslation", () => ({
  useCustomTranslation: () => ({
    t: (key: string, opts?: { val?: unknown }) =>
      opts && opts.val !== undefined ? `${key}:${opts.val}` : key,
    i18n: { language: "en" },
    lang: "en",
    isRtl: false,
  }),
}));

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
  resultsCount?: number;
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
      resultsCount={opts.resultsCount}
    />
  );
  return { ...utils, handlers };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const expand = (label: string) => fireEvent.press(screen.getByText(label));

describe("FilterDrawer", () => {
  it("renders nothing visible when closed (Modal hides children)", () => {
    renderDrawer({ isOpen: false });
    expect(screen.queryByText("Institution Type")).toBeNull();
    expect(screen.queryByText("Public")).toBeNull();
  });

  it("renders every section label, collapsed by default (web default)", () => {
    renderDrawer({ filterConfig: twoSectionConfig });
    expect(screen.getByText("Institution Type")).toBeTruthy();
    expect(screen.getByText("Degree Level")).toBeTruthy();
    expect(screen.queryByText("Public")).toBeNull();
    expect(screen.queryByText("Bachelor")).toBeNull();
  });

  it("expanding a section shows its options; tapping again collapses it", () => {
    renderDrawer({ filterConfig: twoSectionConfig });
    expand("Institution Type");
    expect(screen.getByText("Public")).toBeTruthy();
    expect(screen.getByText("Private")).toBeTruthy();
    expect(screen.queryByText("Bachelor")).toBeNull();
    expand("Institution Type");
    expect(screen.queryByText("Public")).toBeNull();
  });

  it("renders the option count badge as 'N+' (web UFFilterAccordion)", () => {
    renderDrawer();
    expand("Institution Type");
    expect(screen.getByText("12+")).toBeTruthy();
  });

  it("shows the web header title (btnFilterAndSort) and no Clear control in the sheet", () => {
    renderDrawer({ values: { type: ["public"] } });
    expect(screen.getByText("btnFilterAndSort")).toBeTruthy();
    expect(screen.queryByText(/clear/i)).toBeNull();
  });

  it("footer reads 'Show {{val}} Results' with the list total via formatNumber (web parity)", () => {
    renderDrawer({ resultsCount: 1234 });
    // formatNumber mock → "1234"; raw toLocaleString would give "1,234"
    expect(screen.getByText("showResults:1234")).toBeTruthy();
  });

  it("footer falls back to plain 'Show Results' when no total is known", () => {
    renderDrawer();
    expect(screen.getByText("showResultsPlain")).toBeTruthy();
  });

  it("toggling a checkbox does not commit until Apply", () => {
    const { handlers } = renderDrawer();
    expand("Institution Type");
    fireEvent.press(screen.getByText("Public"));
    expect(handlers.onApply).not.toHaveBeenCalled();
  });

  it("Apply fires onApply with the pending multiSelect selection and closes", () => {
    const { handlers } = renderDrawer();
    expand("Institution Type");
    fireEvent.press(screen.getByText("Public"));
    fireEvent.press(screen.getByText("Private"));
    fireEvent.press(screen.getByTestId("filter-drawer-apply"));

    expect(handlers.onApply).toHaveBeenCalledTimes(1);
    expect(handlers.onApply).toHaveBeenCalledWith({ type: ["public", "private"] });
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });

  it("unchecking the last value in a key removes the key entirely", () => {
    const { handlers } = renderDrawer({ values: { type: ["public"] } });
    expand("Institution Type");
    fireEvent.press(screen.getByText("Public"));
    fireEvent.press(screen.getByTestId("filter-drawer-apply"));
    expect(handlers.onApply).toHaveBeenCalledWith({});
  });

  it("seeds the pending selection from the values prop (section badge shows the count)", () => {
    const { handlers } = renderDrawer({ values: { type: ["private"] } });
    expect(screen.getByText("1")).toBeTruthy();
    fireEvent.press(screen.getByTestId("filter-drawer-apply"));
    expect(handlers.onApply).toHaveBeenCalledWith({ type: ["private"] });
  });

  describe("singleSelect", () => {
    it("selecting one applies it as a 1-element array", () => {
      const { handlers } = renderDrawer({ filterConfig: singleConfig });
      expand("Duration");
      expect(screen.getByText("Over 1 year")).toBeTruthy();
      fireEvent.press(screen.getByText("Under 1 year"));
      fireEvent.press(screen.getByTestId("filter-drawer-apply"));
      expect(handlers.onApply).toHaveBeenCalledWith({ duration: ["short"] });
    });

    it("pressing the already-selected option deselects it", () => {
      const { handlers } = renderDrawer({
        filterConfig: singleConfig,
        values: { duration: ["short"] },
      });
      expand("Duration");
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

      expect(fetchOptions).toHaveBeenCalledTimes(1);
      expand("Study Field");
      expect(screen.getByText("common.loading")).toBeTruthy();

      await act(async () => {
        d.resolve([
          { value: "cs", label: "Computer Science" },
          { value: "eng", label: "Engineering" },
        ]);
        await d.promise;
      });

      await waitFor(() => expect(screen.getByText("Computer Science")).toBeTruthy());
      expect(screen.getByText("Engineering")).toBeTruthy();
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
    it("renders min/max labels once the range section is expanded", () => {
      const config: FilterConfig[] = [
        { key: "tuition", label: "Tuition", type: "range", min: 0, max: 10000, step: 500, unit: "$" },
      ];
      renderDrawer({ filterConfig: config });
      expand("Tuition");
      expect(screen.getAllByText("filter.min").length).toBeGreaterThan(0);
      expect(screen.getAllByText("filter.max").length).toBeGreaterThan(0);
    });
  });
});
