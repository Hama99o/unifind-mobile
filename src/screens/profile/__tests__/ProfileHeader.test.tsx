/**
 * ProfileHeader — QA 2026-11-10 DESIGN-05 (#432): the old header (160 px
 * gradient band + 110 px avatar overlapping it) plus the language row and tab
 * bar took ~60% of the screen, leaving each tab a ~700 px strip. Now it is a
 * compact row like Medium / Expedia / talabat on Mobbin: a 64 px avatar
 * inline with the name and email, on a short brand gradient sized by its
 * content (no fixed band height).
 */
import { render, screen, fireEvent } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { ProfileHeader } from "@/screens/profile/ProfileHeader";
import { useAuthStore } from "@/stores/authStore";
import { _registerAlertDialogShow, type AlertAction } from "@/components/ui/alert-dialog";
import { authService } from "@/services/authService";

let mockRtl = false;
jest.mock("@/hooks/useCustomTranslation", () => ({
  useCustomTranslation: () => ({ t: (k: string) => k, isRtl: mockRtl }),
}));
jest.mock("@/services/avatarService", () => ({ avatarService: { uploadAvatar: jest.fn() } }));
jest.mock("expo-image-picker", () => ({}));
jest.mock("@/components/shared/GradientView", () => ({
  GradientView: ({ style, children }: { style?: object; children?: React.ReactNode }) => {
    const { View } = jest.requireActual("react-native");
    return (
      <View testID="profile-header-band" style={style}>
        {children}
      </View>
    );
  },
}));

const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) ?? {};

describe("ProfileHeader (compact)", () => {
  beforeEach(() => {
    mockRtl = false;
    useAuthStore.setState({ user: { sub: "s", userID: "s", email: "qa@x.com" } } as never);
  });

  it("shows a 64 px avatar inline with the name and email", () => {
    render(<ProfileHeader firstName="Sara" lastName="Haddad" email="sara@x.com" />);
    expect(flat("profile-avatar").width).toBe(64);
    expect(flat("profile-avatar").height).toBe(64);
    expect(screen.getByText("Sara Haddad")).toBeTruthy();
    expect(screen.getByText("sara@x.com")).toBeTruthy();
    expect(flat("profile-header-row").flexDirection).toBe("row");
    expect(flat("profile-header-row").alignItems).toBe("center");
  });

  it("has no tall fixed-height band and no overlapping avatar", () => {
    render(<ProfileHeader firstName="Sara" lastName="" email="" />);
    expect(flat("profile-header-band").height).toBeUndefined();
    expect(flat("profile-header-row").marginTop ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("puts the avatar on the right in Arabic", () => {
    mockRtl = true;
    render(<ProfileHeader firstName="Sara" lastName="" email="sara@x.com" />);
    expect(flat("profile-header-row").flexDirection).toBe("row-reverse");
  });

  it("shows the email once when the name is the email (new Auth0 accounts)", () => {
    useAuthStore.setState({ user: { sub: "s", userID: "s", email: "qa@x.com", name: "qa@x.com" } } as never);
    render(<ProfileHeader firstName="" lastName="" email="qa@x.com" />);
    expect(screen.getAllByText("qa@x.com")).toHaveLength(1);
  });

  it("keeps the name on one line so a long email does not double the header", () => {
    render(<ProfileHeader firstName="Sara" lastName="Haddad" email="sara@x.com" />);
    expect(screen.getByText("Sara Haddad").props.numberOfLines).toBe(1);
  });

  it("holds sign-out (confirm, then authService.logout) in the header row", () => {
    const logoutSpy = jest.spyOn(authService, "logout").mockResolvedValue(undefined);
    _registerAlertDialogShow(({ actions }: { actions?: AlertAction[] }) => {
      actions?.find((a) => a.style === "destructive")?.onPress?.();
    });
    render(<ProfileHeader firstName="Sara" lastName="" email="sara@x.com" />);
    const btn = screen.getByTestId("profile-sign-out");
    expect(btn.props.accessibilityLabel).toBe("signOut");
    // a plain style object: a style function was dropped on device (60 px, no bg)
    expect(flat("profile-sign-out").width).toBe(44);
    fireEvent.press(btn);
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    logoutSpy.mockRestore();
  });

  it("falls back to the initial when there is no photo", () => {
    render(<ProfileHeader firstName="sara" lastName="" email="" />);
    expect(screen.getByText("S")).toBeTruthy();
  });
});
