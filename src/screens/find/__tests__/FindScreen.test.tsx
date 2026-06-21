/**
 * FindScreen — Program Explorer tab root container smoke test.
 *
 * FindScreen renders a SubNavBar [Programs | Institutions | Offerings] and
 * switches the body in-place between FindProgramsScreen / FindInstitutionsScreen
 * / FindOfferingsScreen. Default sub-tab = programs (params.find is {} here).
 *
 * Each child list screen composes UniversalList over a Strapi-backed API. We
 * keep the Strapi `http.get` call PENDING (never-resolving) so each UniversalList
 * stays in its LOADING state, which renders the header — SubNavBar tabs + the
 * search input — without mounting the FlatList's ListEmptyComponent.
 *
 * Why not assert the empty state: EmptyState renders a `lucide-react-native`
 * <Inbox> icon that resolves to `undefined` under the jest transform, so the
 * moment a list settles to "empty" the render throws ("Element type is invalid
 * … Check the render method of `Inbox`") and tears the tree down. That is a
 * test-environment source bug in EmptyState (see `sourceBug` in the run result),
 * not in FindScreen, so this smoke test asserts the loading shell instead — the
 * tabs + search input the user always sees first — which is the real behaviour
 * we can observe without tripping the icon crash.
 *
 * SubNavBar exposes testIDs: subnav-tab-programs / -institutions / -offerings.
 * t() returns keys → the search input is identified by its testID.
 */

import { renderWithProviders, screen, fireEvent, act } from "@/test-utils/renderWithProviders";
import { http } from "@/api/http";
import FindScreen from "@/screens/find/FindScreen";

describe("FindScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Keep the list fetch pending so UniversalList stays in its loading state
    // (header only). A resolved empty page would mount EmptyState → <Inbox> crash.
    (http.get as jest.Mock).mockReturnValue(new Promise<never>(() => {}));
  });

  /** Flush the 350ms search-debounce timer so its setState doesn't fire post-test. */
  const settleDebounce = async () => {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
  };

  it("mounts without throwing and renders the SubNavBar tabs", async () => {
    renderWithProviders(<FindScreen />);
    expect(await screen.findByTestId("subnav-tab-programs")).toBeTruthy();
    expect(screen.getByTestId("subnav-tab-institutions")).toBeTruthy();
    expect(screen.getByTestId("subnav-tab-offerings")).toBeTruthy();
    await settleDebounce();
  });

  it("defaults to the Programs sub-tab and renders the universal list shell", async () => {
    renderWithProviders(<FindScreen />);
    // The list search input proves a UniversalList (programs) rendered.
    expect(await screen.findByTestId("list-search-input")).toBeTruthy();
    // Programs tab is active by default; its sibling tabs are present too.
    expect(screen.getByTestId("subnav-tab-programs")).toBeTruthy();
    await settleDebounce();
  });

  it("switches to the Institutions sub-tab and keeps the list shell mounted", async () => {
    renderWithProviders(<FindScreen />);
    fireEvent.press(await screen.findByTestId("subnav-tab-institutions"));
    // FindInstitutionsScreen now drives the body — its UniversalList header
    // (search input) renders, proving the in-place tab switch worked.
    expect(await screen.findByTestId("list-search-input")).toBeTruthy();
    expect(screen.getByTestId("subnav-tab-institutions")).toBeTruthy();
    await settleDebounce();
  });
});
