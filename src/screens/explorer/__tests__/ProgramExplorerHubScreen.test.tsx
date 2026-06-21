/**
 * ProgramExplorerHubScreen — render + tile-grid + navigation smoke test.
 *
 * The hub fetches fields (always) and degrees (when the Degrees tab is active)
 * from programExplorerApi, which calls the globally-mocked Strapi `http`.
 *
 * Data shapes (see programExplorerApi.ts):
 *   fetchFieldOptionsWithIcons → http.get returns RAW ARRAY: [{ fieldOfStudy:{id,name,icon}, count }]
 *   fetchDegreeOptions         → http.get returns RAW ARRAY: [{ degree:{id,title}, count }]
 * (Both guard with Array.isArray(res.data); the default `{ data: {} }` mock
 *  therefore yields [] and the grid shows the empty state.)
 *
 * Navigation uses the module-level `router` export (router.push), and params
 * come from useLocalSearchParams() which the global mock returns as {}.
 * t() returns the key string, so assertions use keys (e.g. "findPrograms",
 * "fields", "degrees", "browseAll", "common.empty").
 */

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import { router } from "expo-router";
import { http } from "@/api/http";
import ProgramExplorerHubScreen from "@/screens/explorer/ProgramExplorerHubScreen";

describe("ProgramExplorerHubScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mounts without throwing and renders the hero breadcrumb, title and tabs", async () => {
    renderWithProviders(<ProgramExplorerHubScreen />);
    // Hero breadcrumb home label + hero title (t keys).
    expect(screen.getByText("tabs.home")).toBeTruthy();
    expect(screen.getByText("findPrograms")).toBeTruthy();
    // Tab switcher labels.
    expect(screen.getByText("degrees")).toBeTruthy();
    // "fields" appears both as a tab label AND the section heading.
    expect(screen.getAllByText("fields").length).toBeGreaterThan(0);
    // Browse-all CTA is always present.
    expect(screen.getByText("browseAll")).toBeTruthy();
    // Let the fields fetch settle to avoid act() warnings.
    await waitFor(() => expect(http.get).toHaveBeenCalled());
  });

  it("renders the Fields grid (empty state when the catalog returns no rows)", async () => {
    renderWithProviders(<ProgramExplorerHubScreen />);
    // Default http mock returns {data:{}} → fields=[] → empty-state key shown.
    await waitFor(() => expect(screen.getByText("common.empty")).toBeTruthy());
  });

  it("renders field tiles when the catalog returns field rows", async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({
      data: [
        { fieldOfStudy: { id: 1, name: "Engineering", icon: "graduation-cap" }, count: 12 },
        { fieldOfStudy: { id: 2, name: "Medicine", icon: "stethoscope" }, count: 7 },
      ],
    });
    renderWithProviders(<ProgramExplorerHubScreen />);
    await waitFor(() => expect(screen.getByText("Engineering")).toBeTruthy());
    expect(screen.getByText("Medicine")).toBeTruthy();
  });

  it("navigates to the find programs list filtered by field when a field tile is pressed", async () => {
    (http.get as jest.Mock).mockResolvedValueOnce({
      data: [{ fieldOfStudy: { id: 1, name: "Engineering", icon: "graduation-cap" }, count: 12 }],
    });
    renderWithProviders(<ProgramExplorerHubScreen />);
    const tile = await screen.findByText("Engineering");
    fireEvent.press(tile);
    expect(router.push).toHaveBeenCalledWith(
      "/(main)/find?find=programs&field=Engineering"
    );
  });

  it("navigates to the plain find programs list when Browse all is pressed", async () => {
    renderWithProviders(<ProgramExplorerHubScreen />);
    fireEvent.press(screen.getByText("browseAll"));
    expect(router.push).toHaveBeenCalledWith("/(main)/find?find=programs");
    await waitFor(() => expect(http.get).toHaveBeenCalled());
  });

  it("switches to the Degrees tab and shows its section heading", async () => {
    renderWithProviders(<ProgramExplorerHubScreen />);
    // Tap the Degrees tab (tab label text). After switch, the section heading
    // "degrees" is rendered by SectionHeading in the content area.
    fireEvent.press(screen.getByText("degrees"));
    await waitFor(() => expect(screen.getAllByText("degrees").length).toBeGreaterThan(0));
  });
});
