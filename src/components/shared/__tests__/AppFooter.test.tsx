/**
 * AppFooter newsletter (QA depth pass BUG-14): validate the email before any
 * request, submit from the keyboard, report focus so the screen can scroll.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { AppFooter } from "@/components/shared/AppFooter";
import { subscribeNewsletter } from "@/api/newsletterApi";

jest.mock("@/api/newsletterApi", () => ({ subscribeNewsletter: jest.fn() }));
const subscribe = subscribeNewsletter as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("AppFooter newsletter", () => {
  it("rejects an invalid email inline without calling the API", () => {
    render(<AppFooter />);
    fireEvent.changeText(screen.getByTestId("newsletter-email"), "not-an-email");
    fireEvent.press(screen.getByText("btnSubscribe"));
    expect(screen.getByText("invalidEmail")).toBeTruthy();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("submits a valid email from the keyboard action key", async () => {
    subscribe.mockResolvedValue({ success: true, message: "ok" });
    render(<AppFooter />);
    const input = screen.getByTestId("newsletter-email");
    fireEvent.changeText(input, "  qa@example.com ");
    fireEvent(input, "submitEditing");
    await waitFor(() => expect(subscribe).toHaveBeenCalledWith("qa@example.com"));
  });

  it("reports focus so the host screen can scroll the field and button into view", () => {
    const onFocus = jest.fn();
    render(<AppFooter onNewsletterFocus={onFocus} />);
    fireEvent(screen.getByTestId("newsletter-email"), "focus");
    expect(onFocus).toHaveBeenCalled();
  });
});
