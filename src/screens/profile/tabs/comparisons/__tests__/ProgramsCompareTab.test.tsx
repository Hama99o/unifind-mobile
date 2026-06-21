/**
 * ProgramsCompareTab — populated comparison table + remove flow.
 *
 * Loader chain (all globally mocked):
 *   nodeApi.get  /compares/Program          → comparesApi.getCompareIds → ["12"]
 *   http.get     /api/programs?...           → catalogItemsApi.getProgramsByIds → [program]
 *   nodeApi.get  /reviews/university/:id/... → injectAvgRatings (avg → 0)
 *
 * Remove goes through confirmAlert() → we register a show fn that auto-fires the
 * destructive action, then assert comparesApi.toggleCompare(POST /compares/) is
 * called and the row disappears locally.
 *
 * t() returns key strings; the comparison table shows the program __name + the
 * built attribute values.
 */

import { renderWithProviders, screen, fireEvent, waitFor } from "@/test-utils/renderWithProviders";
import { nodeApi } from "@/api/nodeApi";
import { http } from "@/api/http";
import { _registerAlertDialogShow, type AlertAction } from "@/components/ui/alert-dialog";
import { useCompareStore } from "@/stores/compareStore";
import { ProgramsCompareTab } from "@/screens/profile/tabs/comparisons/ProgramsCompareTab";

const PROGRAM_ROW = {
  id: 12,
  documentId: "prog-doc-12",
  slug: "computer-science",
  name: "Computer Science",
  about: null,
  degree: { title: "BSc", informationalText: "Bachelor of Science" },
  department: "Engineering",
  nbOfYears: { min: 3, max: 4 },
  nbOfCredits: { min: 120, max: 120 },
  languages: [{ language: "English" }],
  campus: [{ location: { city: { name: "Beirut" }, district: { governorate: "Beirut" } } }],
  institution: { id: 5, name: "Beirut Tech University", slug: "btu", tuition: [] },
  programInfo: [],
  requirements: [],
  specialisations: [],
};

// Second compared program — used by the remove test so the table is never emptied
// to a single row, keeping the EmptyState (lucide <Inbox>) out of the render. The
// global react-native-svg mock omits Polyline, which Inbox uses, so rendering the
// empty branch would crash. Removing one of two rows still proves the "drops the
// row" behaviour without touching that code path.
const PROGRAM_ROW_2 = {
  ...PROGRAM_ROW,
  id: 34,
  documentId: "prog-doc-34",
  slug: "data-science",
  name: "Data Science",
  institution: { id: 7, name: "North Coast University", slug: "ncu", tuition: [] },
};

describe("ProgramsCompareTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCompareStore.getState().setCompared("Program", []);

    (nodeApi.get as jest.Mock).mockImplementation((url: string) => {
      if (url.startsWith("/compares/Program")) {
        return Promise.resolve({
          data: { type: "success", data: [{ _id: "c1", itemID: "12", itemType: "Program", userId: "u" }] },
        });
      }
      if (url.includes("/reviews/university/")) {
        return Promise.resolve({ data: { avgRating: 0 } });
      }
      return Promise.resolve({ data: {} });
    });
    // Strapi programs-by-ids.
    (http.get as jest.Mock).mockResolvedValue({ data: { data: [PROGRAM_ROW] } });
  });

  it("renders the compared program in the table", async () => {
    renderWithProviders(<ProgramsCompareTab />);
    await waitFor(() => expect(screen.getByText("Computer Science")).toBeTruthy());
    // University attribute value comes from institution.name.
    expect(screen.getByText("Beirut Tech University")).toBeTruthy();
  });

  it("removing a program (via confirm) calls comparesApi.toggleCompare and drops the row", async () => {
    // Two compared programs so removing one leaves a non-empty table (see note on
    // PROGRAM_ROW_2 for why the empty branch can't render under the svg mock).
    (http.get as jest.Mock).mockResolvedValue({ data: { data: [PROGRAM_ROW, PROGRAM_ROW_2] } });

    // Auto-confirm: fire the destructive action immediately.
    _registerAlertDialogShow(({ actions }: { actions?: AlertAction[] }) => {
      actions?.find((a) => a.style === "destructive")?.onPress?.();
    });

    renderWithProviders(<ProgramsCompareTab />);
    await waitFor(() => expect(screen.getByText("Computer Science")).toBeTruthy());
    expect(screen.getByText("Data Science")).toBeTruthy();

    // Each program column renders two onPress handlers in order: Trash2 (remove)
    // then ExternalLink (view more). With two columns the order is
    // [remove#1, viewMore#1, remove#2, viewMore#2]. Index 0 removes column #1
    // (Computer Science, numeric id "12").
    // (jest-expo re-exports Pressable through a different module reference than the
    // one ComparisonTable imports, so UNSAFE_getAllByType(Pressable) matches none;
    // querying the composite tree by the onPress prop is reference-independent.)
    const pressables = screen.UNSAFE_root.findAll(
      (node) => typeof node.props?.onPress === "function"
    );
    fireEvent.press(pressables[0]);

    // toggleCompare → POST /compares/ with itemID = numeric id "12".
    await waitFor(() =>
      expect(nodeApi.post as jest.Mock).toHaveBeenCalledWith(
        "/compares/",
        { itemID: "12", itemType: "Program" }
      )
    );
    // The removed row drops locally; the other program stays.
    await waitFor(() => expect(screen.queryByText("Computer Science")).toBeNull());
    expect(screen.getByText("Data Science")).toBeTruthy();
  });
});
