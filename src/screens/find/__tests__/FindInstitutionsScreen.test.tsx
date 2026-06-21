/**
 * FindInstitutionsScreen — Find Institutions list screen smoke + render test.
 *
 * This is the main browse list screen: it composes UniversalList<InstitutionListItem>
 * (search bar + filter trigger + sort + results count + list/empty state) with a
 * sticky CompareBar.
 *
 * With no deep-link params (useLocalSearchParams() → {} from the global mock),
 * the screen skips its pre-load skeleton branch and renders the list directly.
 * All Strapi calls go through the globally-mocked `http`; we point http.get at an
 * empty institutions page so fetchPage resolves to 0 items and the list settles
 * into the empty state.
 *
 * Data shape institutionsApi.list expects: { data: { data: [...], meta: { pagination } } }.
 * CompareBar reads compareStore.getCount(); with no compared items (count 0) it
 * renders nothing, so it never interferes here.
 *
 * t() returns the key string → assert on keys (searchPlaceholder, results,
 * favorites.noInstitutions). The results label is `${total} ${t("results")}`
 * composed into one Text node, so the empty page reads as exactly "0 results".
 */

// lucide-react-native is run through the real transform (not mocked globally),
// and its icons render react-native-svg primitives. The global jest.setup svg
// mock only exports a SUBSET of primitives — notably it lacks `Polyline`, which
// the `Inbox` icon used by <EmptyState> renders. Hitting the undefined `Polyline`
// throws inside <Svg> and tears down the tree ("Unable to find node on an
// unmounted component"), which broke every empty-state / loading-path assertion
// here (the data-row test happened to dodge it). Icons carry no assertable text,
// so render them as inert nodes. This mirrors the shim in UniversalList.test.tsx
// and is a test-environment fix, not a change to app behaviour.
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
import { http } from "@/api/http";
import FindInstitutionsScreen from "@/screens/find/FindInstitutionsScreen";

const EMPTY_PAGE = {
  data: { data: [], meta: { pagination: { page: 1, pageCount: 1, total: 0 } } },
};

const ONE_INSTITUTION_PAGE = {
  data: {
    data: [
      {
        id: 101,
        documentId: "doc-101",
        name: "Beirut Tech University",
        acronym: "BTU",
        slug: "beirut-tech",
        about: null,
        tuition: [],
        mainLocation: { city: { name: "Beirut" }, country: { name: "Lebanon" } },
        ranking: [],
        logo: { url: "" },
        photoCover: { url: "" },
      },
    ],
    meta: { pagination: { page: 1, pageCount: 1, total: 1 } },
  },
};

describe("FindInstitutionsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: every Strapi call (location preload + list + reviews avg) → empty.
    (http.get as jest.Mock).mockResolvedValue(EMPTY_PAGE);
  });

  it("mounts without throwing and renders the search bar + filter trigger", async () => {
    renderWithProviders(<FindInstitutionsScreen />);
    // Search input + filter button live in the list header (rendered even while
    // loading). findBy* retries inside act() so we never read a stale fiber
    // between the screen's async re-renders.
    expect(await screen.findByTestId("list-search-input")).toBeTruthy();
    expect(await screen.findByTestId("filter-drawer-trigger")).toBeTruthy();
  });

  it("shows the empty state when no institutions are returned", async () => {
    renderWithProviders(<FindInstitutionsScreen />);
    // After the page-1 fetch settles to 0 items, the empty-state title shows.
    expect(await screen.findByText("common.noResults")).toBeTruthy();
    // Results count renders the composed `${total} ${t("results")}` → "0 results".
    await waitFor(() => expect(screen.getByText("0 results")).toBeTruthy());
  });

  it("renders an institution card when the catalog returns a row", async () => {
    (http.get as jest.Mock).mockResolvedValue(ONE_INSTITUTION_PAGE);
    renderWithProviders(<FindInstitutionsScreen />);
    // InstitutionCard surfaces the name + acronym (type).
    expect(await screen.findByText("Beirut Tech University")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("BTU")).toBeTruthy());
  });

  it("debounces typing into the search input and re-fetches with the typed query", async () => {
    jest.useFakeTimers();
    try {
      renderWithProviders(<FindInstitutionsScreen />);
      // Flush the initial mount + page-1 fetch under fake timers.
      await act(async () => {
        await Promise.resolve();
      });

      const input = screen.getByTestId("list-search-input");
      act(() => {
        fireEvent.changeText(input, "engineering");
      });

      // Advance past the 350ms debounce → debouncedSearch updates → re-fetch.
      // institutionsApi.list builds the Strapi URL with the OR-search on name,
      // so http.get is eventually called with the typed query in the query string.
      await act(async () => {
        jest.advanceTimersByTime(350);
        await Promise.resolve();
      });

      // institutionsApi.list builds the URL via URLSearchParams, which percent-
      // encodes the bracketed keys but leaves the alphanumeric value as-is, so
      // the typed term appears literally as "=engineering" in the query string.
      await waitFor(() => {
        const calls = (http.get as jest.Mock).mock.calls.map((c) => String(c[0]));
        expect(calls.some((url) => url.includes("=engineering"))).toBe(true);
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
