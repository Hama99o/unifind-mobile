/**
 * FilterTags — render + interaction tests.
 *
 * Source: src/components/common/FilterTags.tsx
 *
 * Behaviour traced from source:
 * - Builds a flat chip list from filterValues × filterConfig.
 * - Multi-select chips: one chip per selected string value; label is the matching
 *   option's label, falling back to the filter config's `label` if not found.
 * - Range chips: a single "min — max" chip. When unit is "$" each bound goes through
 *   the localization mock formatCurrency(v,"USD") => `$${v.toFixed(2)}`. Otherwise it
 *   goes through formatNumber (String(v)) and, if a non-"$" unit is set, the unit is
 *   PREPENDED: `${unit}${n}` (quirk: unit comes before the number).
 * - Pressing a chip calls onRemove(key, value). The whole chip is the tap target;
 *   the X icon is visual-only.
 * - A "clearSelection" chip appears only when there is MORE THAN ONE chip; pressing it
 *   calls onClearAll.
 * - Renders nothing (null) when there are no active chips.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { FilterTags } from "@/components/common/FilterTags";
import type {
  FilterConfig,
  FilterValues,
} from "@/components/common/FilterDrawer";

const multiConfig: FilterConfig[] = [
  {
    key: "country",
    label: "Country",
    type: "multiSelect",
    options: [
      { value: "lb", label: "Lebanon" },
      { value: "fr", label: "France" },
    ],
  },
];

describe("FilterTags", () => {
  it("renders nothing when there are no active filters", () => {
    const { toJSON } = render(
      <FilterTags
        filterValues={{}}
        filterConfig={multiConfig}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it("renders nothing when a multi-select value is an empty array", () => {
    const { toJSON } = render(
      <FilterTags
        filterValues={{ country: [] }}
        filterConfig={multiConfig}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });

  it("renders one chip per selected multi-select value using the option label", () => {
    const values: FilterValues = { country: ["lb", "fr"] };
    render(
      <FilterTags
        filterValues={values}
        filterConfig={multiConfig}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.getByText("Lebanon")).toBeTruthy();
    expect(screen.getByText("France")).toBeTruthy();
  });

  it("falls back to the filter config label when the option is not found", () => {
    const values: FilterValues = { country: ["unknown-id"] };
    render(
      <FilterTags
        filterValues={values}
        filterConfig={multiConfig}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    // No option matches "unknown-id" -> chip label falls back to fc.label "Country"
    expect(screen.getByText("Country")).toBeTruthy();
  });

  it("resolves labels from optionsByKey (async-loaded) when not in static options", () => {
    const cfg: FilterConfig[] = [
      { key: "field", label: "Field", type: "multiSelect" },
    ];
    render(
      <FilterTags
        filterValues={{ field: ["cs"] }}
        filterConfig={cfg}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
        optionsByKey={{ field: [{ value: "cs", label: "Computer Science" }] }}
      />
    );
    expect(screen.getByText("Computer Science")).toBeTruthy();
  });

  it("calls onRemove with (key, value) when a chip is pressed", () => {
    const onRemove = jest.fn();
    render(
      <FilterTags
        filterValues={{ country: ["lb"] }}
        filterConfig={multiConfig}
        onRemove={onRemove}
        onClearAll={jest.fn()}
      />
    );
    fireEvent.press(screen.getByText("Lebanon"));
    expect(onRemove).toHaveBeenCalledWith("country", "lb");
  });

  it("does NOT show the clear-all chip when only one chip is present", () => {
    render(
      <FilterTags
        filterValues={{ country: ["lb"] }}
        filterConfig={multiConfig}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.queryByText("clearSelection")).toBeNull();
  });

  it("shows the clear-all chip and fires onClearAll when more than one chip", () => {
    const onClearAll = jest.fn();
    render(
      <FilterTags
        filterValues={{ country: ["lb", "fr"] }}
        filterConfig={multiConfig}
        onRemove={jest.fn()}
        onClearAll={onClearAll}
      />
    );
    const clear = screen.getByText("clearSelection");
    expect(clear).toBeTruthy();
    fireEvent.press(clear);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("renders a currency range chip via formatCurrency when unit is '$'", () => {
    const cfg: FilterConfig[] = [
      { key: "fees", label: "Fees", type: "range", unit: "$" },
    ];
    render(
      <FilterTags
        filterValues={{ fees: [2000, 4000] }}
        filterConfig={cfg}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    // formatCurrency mock => `$${v.toFixed(2)}`
    expect(screen.getByText("$2000.00 — $4000.00")).toBeTruthy();
  });

  it("renders a numeric range chip with the unit PREPENDED for non-'$' units (quirk)", () => {
    const cfg: FilterConfig[] = [
      { key: "distance", label: "Distance", type: "range", unit: "km" },
    ];
    render(
      <FilterTags
        filterValues={{ distance: [1, 5] }}
        filterConfig={cfg}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    // formatNumber mock => String(v); unit is prepended -> "km1" / "km5"
    expect(screen.getByText("km1 — km5")).toBeTruthy();
  });

  it("renders a plain numeric range chip when no unit is set", () => {
    const cfg: FilterConfig[] = [
      { key: "year", label: "Year", type: "range" },
    ];
    render(
      <FilterTags
        filterValues={{ year: [2020, 2024] }}
        filterConfig={cfg}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(screen.getByText("2020 — 2024")).toBeTruthy();
  });

  it("removing a range chip calls onRemove with the sentinel '__range__' value", () => {
    const onRemove = jest.fn();
    const cfg: FilterConfig[] = [
      { key: "year", label: "Year", type: "range" },
    ];
    render(
      <FilterTags
        filterValues={{ year: [2020, 2024] }}
        filterConfig={cfg}
        onRemove={onRemove}
        onClearAll={jest.fn()}
      />
    );
    fireEvent.press(screen.getByText("2020 — 2024"));
    expect(onRemove).toHaveBeenCalledWith("year", "__range__");
  });

  it("ignores a range value that is not a numeric tuple", () => {
    const cfg: FilterConfig[] = [
      { key: "year", label: "Year", type: "range" },
    ];
    const { toJSON } = render(
      <FilterTags
        // string tuple — typeof rangeVal[0] !== "number" -> not added as a chip
        filterValues={{ year: ["a", "b"] }}
        filterConfig={cfg}
        onRemove={jest.fn()}
        onClearAll={jest.fn()}
      />
    );
    expect(toJSON()).toBeNull();
  });
});
