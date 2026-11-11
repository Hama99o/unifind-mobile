/**
 * ProfileTabBar — horizontal tab bar for the 7 profile tabs + sign-out.
 *
 * Each tab Pressable has accessibilityRole="tab" and a testID profile-tab-<id>.
 * Tapping a tab fires onTabChange(tabId). Sign-out goes through confirmAlert()
 * (a no-op unless an AlertDialogHost registered its show fn) → authService.logout().
 * We register a show fn that auto-fires the destructive action, and spy on
 * authService.logout to assert it runs.
 *
 * t() returns key strings.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";

// lucide-react-native 0.475 ships some icons (notably `Clock` and `LogOut`)
// that fail to render under jest-expo's transform ("Element type is invalid"),
// even though they import fine. The app uses real icons on device — here we
// stub every icon to a no-op so ProfileTabBar can mount and its real behaviour
// (labels, active state, onTabChange, sign-out) can be asserted.
jest.mock("lucide-react-native", () => {
  const StubIcon = () => null;
  return new Proxy(
    {},
    { get: () => StubIcon }
  );
});

import { _registerAlertDialogShow, type AlertAction } from "@/components/ui/alert-dialog";
import { authService } from "@/services/authService";
import { ProfileTabBar } from "@/screens/profile/ProfileTabBar";

describe("ProfileTabBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all seven tab labels", () => {
    render(<ProfileTabBar activeTab="profile" onTabChange={jest.fn()} />);
    expect(screen.getByText("profileInformation")).toBeTruthy();
    expect(screen.getByText("accountCredentials")).toBeTruthy();
    expect(screen.getByText("aboutMe")).toBeTruthy();
    expect(screen.getByText("activity")).toBeTruthy();
    expect(screen.getByText("myFavorites")).toBeTruthy();
    expect(screen.getByText("myComparisons")).toBeTruthy();
    expect(screen.getByText("myBookings")).toBeTruthy();
  });

  it("marks the active tab as selected", () => {
    render(<ProfileTabBar activeTab="bookings" onTabChange={jest.fn()} />);
    const bookingsTab = screen.getByTestId("profile-tab-bookings");
    expect(bookingsTab.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
    const profileTab = screen.getByTestId("profile-tab-profile");
    expect(profileTab.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false })
    );
  });

  it("fires onTabChange with the tapped tab id", () => {
    const onTabChange = jest.fn();
    render(<ProfileTabBar activeTab="profile" onTabChange={onTabChange} />);
    fireEvent.press(screen.getByTestId("profile-tab-favorites"));
    expect(onTabChange).toHaveBeenCalledWith("favorites");
  });

  it("no longer holds sign-out (moved into the compact header, DESIGN-05)", () => {
    render(<ProfileTabBar activeTab="profile" onTabChange={jest.fn()} />);
    expect(screen.queryByTestId("profile-sign-out")).toBeNull();
  });
});
