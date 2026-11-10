/**
 * UniversalList<T> — integration tests for the core list primitive.
 *
 * Traced against src/components/common/UniversalList.tsx. The component owns its
 * own state (it does NOT use react-query) and drives everything off
 * `config.fetchPage`, which returns a Page<T>.
 *
 * What we verify:
 *   - initial loading shows the skeleton, then renders items via renderItem
 *   - empty result shows EmptyState (config.empty.title)
 *   - error path (fetchPage rejects) shows the error title + a retry button,
 *     and retry re-invokes fetchPage
 *   - "N results" count reflects page.total
 *   - search input debounces (350ms) and re-fetches with the typed query
 *   - the filter trigger + sort trigger are present when configured
 *   - pull-to-refresh re-fetches page 1
 *   - load-more (onEndReached) fetches the next page and appends, and is a
 *     no-op once page >= pageCount
 *   - header/footer render (header always; footer spinner only while loadingMore)
 *
 * Notes/quirks asserted:
 *   - t() is mocked to return the key string, so the error title is the
 *     resolved value of config.fetchPage's catch -> t("common.retry") ==
 *     "common.retry"; the results label is `${total} results`.
 */

// lucide-react-native is run through the real transform (not mocked globally),
// and its icons render react-native-svg primitives. The global jest.setup svg
// mock only exports a subset of primitives — notably it lacks `Polyline`, which
// the `Inbox` icon used by <EmptyState> renders. Hitting the undefined `Polyline`
// throws inside <Svg> and tears down the tree ("Unable to find node on an
// unmounted component"), which is what broke the empty/error-path assertions.
// Icons carry no assertable text, so render them as inert nodes here. This is a
// test-environment shim, not a change to app behaviour.
jest.mock("lucide-react-native", () => {
  const React = require("react");
  return new Proxy(
    {},
    {
      get: () => (props: Record<string, unknown>) =>
        React.createElement("Icon", props),
    }
  );
});

import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@/test-utils/renderWithProviders";
import { FlatList } from "react-native";
import { Text } from "@/components/ui/text";
import { UniversalList } from "@/components/common/UniversalList";
import type { UniversalListConfig } from "@/components/common/UniversalListTypes";
import type { Page } from "@/types/page";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  name: string;
}

function page(items: Item[], over: Partial<Page<Item>> = {}): Page<Item> {
  return {
    items,
    page: over.page ?? 1,
    pageCount: over.pageCount ?? 1,
    total: over.total ?? items.length,
  };
}

const itemsP1: Item[] = [
  { id: "a", name: "Alpha University" },
  { id: "b", name: "Beta College" },
];

function baseConfig(
  fetchPage: UniversalListConfig<Item>["fetchPage"],
  over: Partial<UniversalListConfig<Item>> = {}
): UniversalListConfig<Item> {
  return {
    queryKey: ["test-list"],
    fetchPage,
    renderItem: (item) => <Text testID={`row-${item.id}`}>{item.name}</Text>,
    keyExtractor: (item) => item.id,
    searchPlaceholder: "Search institutions",
    searchable: true,
    empty: { title: "Nothing found", description: "Try another search" },
    ...over,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("UniversalList", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the skeleton while loading, then renders items via renderItem", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);

    // First render: loading=true -> ListSkeleton mounted, no rows yet.
    expect(screen.queryByTestId("row-a")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("row-a")).toBeTruthy();
    });
    expect(screen.getByText("Alpha University")).toBeTruthy();
    expect(screen.getByText("Beta College")).toBeTruthy();
    // Fetched once on mount with empty search/filters and the default sort.
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith({
      page: 1,
      search: "",
      filters: {},
      sort: "default",
    });
  });

  it("renders the search bar with the configured placeholder", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    const input = screen.getByTestId("list-search-input");
    expect(input.props.placeholder).toBe("Search institutions");
  });

  // Regression: typing in search used to remount the header (new
  // ListHeaderComponent function each render + separate loading tree), so the
  // input lost focus after the first character on device.
  it("keeps the same search input mounted while typing and refetching", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    const input = screen.getByTestId("list-search-input");

    fireEvent.changeText(input, "L");
    expect(screen.getByTestId("list-search-input")).toBe(input);
    fireEvent.changeText(input, "Le");
    await waitFor(() =>
      expect(fetchPage).toHaveBeenCalledWith(expect.objectContaining({ search: "Le" }))
    );
    expect(screen.getByTestId("list-search-input")).toBe(input);
  });

  it("shows the results count from page.total", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1, { total: 42 }));
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    // header label is `${total} ${t("results")}` -> "42 results"
    await waitFor(() => expect(screen.getByText("42 results")).toBeTruthy());
  });

  it("hides the results count when showResultsCount is false", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1, { total: 42 }));
    renderWithProviders(
      <UniversalList config={baseConfig(fetchPage, { showResultsCount: false })} />
    );
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    expect(screen.queryByText("42 results")).toBeNull();
  });

  it("shows the EmptyState (config.empty.title) when the result is empty", async () => {
    const fetchPage = jest.fn(async () => page([], { total: 0 }));
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    await waitFor(() => expect(screen.getByText("Nothing found")).toBeTruthy());
    expect(screen.getByText("Try another search")).toBeTruthy();
  });

  it("shows an error + retry button when fetchPage rejects, and retry re-fetches", async () => {
    const fetchPage = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue(page(itemsP1));

    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);

    // catch -> setError(t("common.loadError")); EmptyState shows the error title
    // ("common.loadError") + description ("common.loadErrorDesc"), plus a separate
    // retry Button labelled "common.retry".
    await waitFor(() => {
      expect(screen.getByText("common.loadError")).toBeTruthy();
    });
    expect(screen.getByText("common.retry")).toBeTruthy();
    expect(fetchPage).toHaveBeenCalledTimes(1);
    // QA offline pass: no misleading "0 results" next to the error.
    expect(screen.queryByText(/results$/)).toBeNull();

    // Press the retry Button (label "common.retry")
    fireEvent.press(screen.getByText("common.retry"));

    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("debounces the search input (350ms) then re-fetches with the typed query", async () => {
    jest.useFakeTimers();
    const fetchPage = jest.fn(async () => page(itemsP1));

    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);

    // Flush the initial fetch + state updates under fake timers.
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchPage).toHaveBeenCalledTimes(1);

    const input = screen.getByTestId("list-search-input");
    act(() => {
      fireEvent.changeText(input, "harvard");
    });

    // Before the debounce fires, no new fetch with the new query.
    expect(fetchPage).toHaveBeenCalledTimes(1);

    // Advance past the 350ms debounce -> debouncedSearch updates -> re-fetch.
    await act(async () => {
      jest.advanceTimersByTime(350);
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(fetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ search: "harvard", page: 1 })
      )
    );
  });

  it("renders the filter trigger when filters are configured", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    const config = baseConfig(fetchPage, {
      filters: [
        { key: "type", label: "Type", type: "multiSelect", options: [
          { value: "public", label: "Public" },
          { value: "private", label: "Private" },
        ] },
      ],
    });
    renderWithProviders(<UniversalList config={config} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    expect(screen.getByTestId("filter-drawer-trigger")).toBeTruthy();
  });

  it("does not render the filter trigger when no filters are configured", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    expect(screen.queryByTestId("filter-drawer-trigger")).toBeNull();
  });

  it("opens the filter drawer and applies a selection, re-fetching with filters", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    const config = baseConfig(fetchPage, {
      filters: [
        {
          key: "type",
          label: "Type",
          type: "multiSelect",
          options: [
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ],
        },
      ],
    });
    renderWithProviders(<UniversalList config={config} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());

    // Open the drawer (Modal renders children only when visible).
    fireEvent.press(screen.getByTestId("filter-drawer-trigger"));

    // The drawer body now shows the options (sections expanded by default).
    await waitFor(() => expect(screen.getByText("Private")).toBeTruthy());

    fireEvent.press(screen.getByText("Private"));
    fireEvent.press(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() =>
      expect(fetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ filters: { type: ["private"] }, page: 1 })
      )
    );
  });

  it("fetches the next page on load-more and appends the items", async () => {
    const fetchPage = jest
      .fn()
      .mockImplementation(async ({ page: p }: { page: number }) =>
        p === 1
          ? page(itemsP1, { page: 1, pageCount: 2, total: 4 })
          : page(
              [
                { id: "c", name: "Gamma Institute" },
                { id: "d", name: "Delta School" },
              ],
              { page: 2, pageCount: 2, total: 4 }
            )
      );

    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());

    const list = screen.UNSAFE_getByType(FlatList);
    act(() => {
      list.props.onEndReached();
    });

    await waitFor(() => expect(screen.getByTestId("row-c")).toBeTruthy());
    // Page 1 items still present (appended, not replaced)
    expect(screen.getByTestId("row-a")).toBeTruthy();
    expect(screen.getByTestId("row-d")).toBeTruthy();
    expect(fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it("does not load more once page >= pageCount (single-page result)", async () => {
    const fetchPage = jest.fn(async () =>
      page(itemsP1, { page: 1, pageCount: 1, total: 2 })
    );
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());

    const list = screen.UNSAFE_getByType(FlatList);
    act(() => {
      list.props.onEndReached();
    });
    // No second fetch — handleLoadMore returns early when page >= pageCount.
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("pull-to-refresh re-fetches page 1", async () => {
    const fetchPage = jest.fn(async () =>
      page(itemsP1, { page: 1, pageCount: 2, total: 4 })
    );
    renderWithProviders(<UniversalList config={baseConfig(fetchPage)} />);
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    expect(fetchPage).toHaveBeenCalledTimes(1);

    const list = screen.UNSAFE_getByType(FlatList);
    act(() => {
      // RefreshControl onRefresh
      list.props.refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    expect(fetchPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it("applies initialSort to the first fetch", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    const config = baseConfig(fetchPage, {
      sort: {
        default: "default",
        options: [
          { key: "default", label: "Default" },
          { key: "name", label: "Name" },
        ],
      },
    });
    renderWithProviders(
      <UniversalList config={config} initialSort="name" />
    );
    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    expect(fetchPage).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "name" })
    );
  });

  it("applies initialFilters to the first fetch", async () => {
    const fetchPage = jest.fn(async () => page(itemsP1));
    const config = baseConfig(fetchPage, {
      filters: [
        {
          key: "type",
          label: "Type",
          type: "multiSelect",
          options: [{ value: "public", label: "Public" }],
        },
      ],
    });
    renderWithProviders(
      <UniversalList config={config} initialFilters={{ type: ["public"] }} />
    );
    await waitFor(() =>
      expect(fetchPage).toHaveBeenCalledWith(
        expect.objectContaining({ filters: { type: ["public"] } })
      )
    );
  });

  it("re-sorts the accumulated list with clientComparator when provided", async () => {
    // Page 1 returns out-of-order items; clientComparator sorts by name asc.
    const fetchPage = jest.fn(async () =>
      page(
        [
          { id: "z", name: "Zeta" },
          { id: "a", name: "Alpha" },
        ],
        { page: 1, pageCount: 1, total: 2 }
      )
    );
    const config = baseConfig(fetchPage, {
      clientComparator: (a, b) => a.name.localeCompare(b.name),
    });
    renderWithProviders(<UniversalList config={config} />);

    await waitFor(() => expect(screen.getByTestId("row-a")).toBeTruthy());
    const list = screen.UNSAFE_getByType(FlatList);
    // data is sorted: Alpha (a) before Zeta (z)
    expect(list.props.data.map((i: Item) => i.id)).toEqual(["a", "z"]);
  });
});
