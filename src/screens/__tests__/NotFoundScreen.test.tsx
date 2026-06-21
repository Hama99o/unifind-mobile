/**
 * NotFoundScreen — 404 page render + "Go Home" navigation smoke test.
 *
 * Pure presentational; no API. Renders the brand logo, a literal "404", the
 * pageNotFound / pageNotFoundDesc copy (t keys) and a "goToHome" button that
 * router.replace()s to the home tab.
 *
 * NotFoundScreen reads `useRouter()` from expo-router. The global jest.setup
 * mock returns a FRESH { replace } object on every call, so spying on the
 * namespace export does not reach the binding the component captures. We
 * therefore re-mock expo-router for this file with a STABLE `replace` mock we
 * can assert against (name is `mock`-prefixed so the hoisted factory may use it).
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import NotFoundScreen from "@/screens/NotFoundScreen";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

describe("NotFoundScreen", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("mounts without throwing and renders the 404 message + description", () => {
    render(<NotFoundScreen />);
    expect(screen.getByText("404")).toBeTruthy();
    expect(screen.getByText("pageNotFound")).toBeTruthy();
    expect(screen.getByText("pageNotFoundDesc")).toBeTruthy();
  });

  it("renders the Go Home CTA", () => {
    render(<NotFoundScreen />);
    expect(screen.getByText("goToHome")).toBeTruthy();
  });

  it("navigates to the home tab when Go Home is pressed", () => {
    render(<NotFoundScreen />);
    fireEvent.press(screen.getByText("goToHome"));
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/(main)/(tabs)/home");
  });
});
