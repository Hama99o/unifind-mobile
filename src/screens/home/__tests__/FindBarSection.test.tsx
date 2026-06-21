/**
 * FindBarSection — render + interaction smoke test (browse batch).
 *
 * FindBarSection is the home-screen hero with a 3-way segmented control
 * (Programs / Institutions / Offerings) and a "Find" CTA that navigates via
 * useRouter().push(...).
 *
 * Notes on the test environment:
 *  - useCustomTranslation.t() returns the key string unchanged, so we assert
 *    on keys: "findYour", "institution", "find", and the dynamic words.
 *  - FindBarFilters fires several useQuery() catalog calls; they resolve via
 *    the globally-mocked http to `{ data: {} }`, so each field falls back to
 *    its placeholder and the panel never blocks. We render with providers.
 *  - We mock expo-router LOCALLY here (overriding the global stub) so that the
 *    `useRouter().push` the component calls is a STABLE jest.fn we can assert.
 *    A `jest.spyOn` in beforeEach would be too late: the component captures its
 *    `useRouter` binding when this file imports it (module-eval), before any
 *    beforeEach runs — so the component would keep the global fresh-each-call
 *    push and our spy would never be hit.
 *  - Reanimated (withSpring/withTiming) is stubbed in jest.setup, so the
 *    tab-change / hero entrance animations are inert no-ops.
 */

// `mock`-prefixed name is allowed inside a hoisted jest.mock factory.
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: mockPush, replace: jest.fn(), back: jest.fn() },
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: unknown }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
  Redirect: () => null,
}));

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import { FindBarSection } from "@/screens/home/FindBarSection";

describe("FindBarSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("mounts without throwing and renders the hero headline + segmented tabs", () => {
    renderWithProviders(<FindBarSection />);
    // Static greeting word (t key).
    expect(screen.getByText("findYour")).toBeTruthy();
    // Tabs (Programs / Institutions / Offerings).
    expect(screen.getByTestId("findbar-tab-program")).toBeTruthy();
    expect(screen.getByTestId("findbar-tab-institution")).toBeTruthy();
    expect(screen.getByTestId("findbar-tab-offering")).toBeTruthy();
    // The Find CTA.
    expect(screen.getByTestId("findbar-find")).toBeTruthy();
  });

  it("defaults to the Programs tab and navigates to find?find=programs on Find", () => {
    renderWithProviders(<FindBarSection />);
    fireEvent.press(screen.getByTestId("findbar-find"));
    expect(mockPush).toHaveBeenCalledTimes(1);
    // Default tab = program → FindScreen programs sub-tab (no extra filters set).
    expect(mockPush).toHaveBeenCalledWith("/(main)/find?find=programs");
  });

  it("switches to the Institutions tab and navigates to find?find=institutions", async () => {
    renderWithProviders(<FindBarSection />);
    fireEvent.press(screen.getByTestId("findbar-tab-institution"));
    // The dynamic headline word updates to the institution key (also a tab label).
    await waitFor(() => expect(screen.getAllByText("institution").length).toBeGreaterThan(0));
    fireEvent.press(screen.getByTestId("findbar-find"));
    expect(mockPush).toHaveBeenCalledWith("/(main)/find?find=institutions");
  });

  it("switches to the Offerings tab and navigates to the growth-center hub on Find", () => {
    renderWithProviders(<FindBarSection />);
    fireEvent.press(screen.getByTestId("findbar-tab-offering"));
    fireEvent.press(screen.getByTestId("findbar-find"));
    // Offering tab routes to the growth center hub, not the find list (no values → trailing "?").
    expect(mockPush).toHaveBeenCalledWith("/(main)/(tabs)/growth-center?");
  });
});
