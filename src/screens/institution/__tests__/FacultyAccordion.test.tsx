/**
 * FacultyAccordion — RQ-01: programs load (React Query) only once the accordion
 * is opened, then stay cached.
 */

import { renderWithProviders, screen, fireEvent, waitFor, act } from "@/test-utils/renderWithProviders";
import { FacultyAccordion } from "@/screens/institution/FacultyAccordion";
import { institutionDetailApi } from "@/api/institutionDetailApi";

jest.mock("@/api/institutionDetailApi", () => ({
  DEGREE_TITLE_MAP: jest.requireActual("@/api/institutionDetailApi").DEGREE_TITLE_MAP,
  institutionDetailApi: { getProgramsForFaculty: jest.fn() },
}));
const getPrograms = institutionDetailApi.getProgramsForFaculty as jest.Mock;

const faculty = { facultyName: "Faculty of Law", campuses: [], degrees: [] };

beforeEach(() => {
  jest.clearAllMocks();
  getPrograms.mockResolvedValue([{ id: 1, documentId: "p1", name: "Private Law", slug: "private-law" }]);
});

describe("FacultyAccordion", () => {
  it("does not fetch while closed; fetches and lists programs once opened", async () => {
    renderWithProviders(
      <FacultyAccordion faculty={faculty} activeTab="Bachelors" institutionSlug="lu" locale="ar" isLoggedIn={false} isFirst={false} />
    );
    expect(getPrograms).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: /Faculty of Law/ }));
    });
    await waitFor(() => expect(getPrograms).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("Private Law")).toBeTruthy());
    expect(getPrograms).toHaveBeenCalledWith("lu", "Faculty of Law", expect.any(Array), "ar", false);
  });

  it("the first accordion opens and loads immediately", async () => {
    renderWithProviders(
      <FacultyAccordion faculty={faculty} activeTab="Others" institutionSlug="lu" locale="en" isLoggedIn={false} isFirst />
    );
    await waitFor(() => expect(screen.getByText("Private Law")).toBeTruthy());
    expect(getPrograms).toHaveBeenCalledWith("lu", "Faculty of Law", [], "en", true);
  });
});
