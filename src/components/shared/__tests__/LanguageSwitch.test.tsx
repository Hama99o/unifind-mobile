import { render, screen, fireEvent } from "@testing-library/react-native";
import { LanguageSwitch } from "@/components/shared/LanguageSwitch";
import { setAppLanguage } from "@/i18n/language";

jest.mock("@/i18n/language", () => ({ setAppLanguage: jest.fn() }));

describe("LanguageSwitch (PARITY-02)", () => {
  it("marks the current language and switches to the other one", () => {
    render(<LanguageSwitch />);
    expect(screen.getByTestId("language-en").props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(screen.getByTestId("language-ar"));
    expect(setAppLanguage).toHaveBeenCalledWith("ar");
  });

  it("does nothing when the active language is pressed", () => {
    render(<LanguageSwitch />);
    fireEvent.press(screen.getByTestId("language-en"));
    expect(setAppLanguage).not.toHaveBeenCalledWith("en");
  });
});
