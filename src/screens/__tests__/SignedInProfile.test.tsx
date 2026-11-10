/**
 * Signed-in Profile shell. QA 2026-11-10:
 * - with the keyboard open the fixed header left ~90 px for the form, so the
 *   focused field stayed hidden → the header hides while the keyboard is up;
 * - a new account has no name/email in Node user info, so after an app
 *   restart the header said just "Profile" → falls back to the auth email.
 */
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { SignedInProfile } from "@/screens/ProfileScreen";
import { useAuthStore } from "@/stores/authStore";

let mockKeyboard = false;
jest.mock("@/hooks/useKeyboardVisible", () => ({ useKeyboardVisible: () => mockKeyboard }));
jest.mock("@/hooks/queries/useProfile", () => ({ useUserInfo: () => ({ data: { firstName: "", lastName: "", email: "" } }) }));
jest.mock("@/screens/profile/ProfileHeader", () => ({
  ProfileHeader: (p: { email: string }) => {
    const { Text: T } = jest.requireActual("react-native");
    return <T>{`HEADER:${p.email}`}</T>;
  },
}));
jest.mock("@/screens/profile/ProfileTabBar", () => ({ ProfileTabBar: () => null }));
jest.mock("@/screens/profile/tabs/ProfileInformationTab", () => ({ ProfileInformationTab: () => null }));

describe("SignedInProfile", () => {
  beforeEach(() => {
    mockKeyboard = false;
    useAuthStore.setState({ isLoggedIn: true, user: { sub: "s", userID: "s", email: "qa@x.com" } } as never);
  });

  it("falls back to the signed-in email when Node user info has none", () => {
    render(<SignedInProfile />);
    expect(screen.getByText("HEADER:qa@x.com")).toBeTruthy();
  });

  it("hides the header while the keyboard is open", () => {
    mockKeyboard = true;
    render(<SignedInProfile />);
    expect(screen.queryByText(/^HEADER:/)).toBeNull();
  });
});
void Text;
