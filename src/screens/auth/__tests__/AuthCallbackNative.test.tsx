/**
 * Native Auth0 callback route. On Android it DOES render (Custom Tabs hands
 * the deep link to the mockRouter) — QA 2026-11-10: it always replaced to Home,
 * so signing in from an offering / favorites / compare lost the user's place.
 */
import { render, act } from "@testing-library/react-native";
import AuthCallbackNative from "../../../../app/auth/callback";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

describe("AuthCallbackNative", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("returns to the screen the user signed in from", () => {
    mockRouter.canGoBack.mockReturnValue(true);
    render(<AuthCallbackNative />);
    act(() => jest.advanceTimersByTime(1500));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("falls back to Home when there is nothing to go back to (cold start)", () => {
    mockRouter.canGoBack.mockReturnValue(false);
    render(<AuthCallbackNative />);
    act(() => jest.advanceTimersByTime(1500));
    expect(mockRouter.replace).toHaveBeenCalledWith("/(main)/(tabs)/home");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
