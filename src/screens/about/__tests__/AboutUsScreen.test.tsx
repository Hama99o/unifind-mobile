/**
 * AboutUsScreen — PARITY-01: mobile port of the web /about-us (OurStoryPage).
 */

import { renderWithProviders, screen } from "@/test-utils/renderWithProviders";
import AboutUsScreen from "@/screens/about/AboutUsScreen";

describe("AboutUsScreen", () => {
  it("renders every section of the web Our Story page", () => {
    renderWithProviders(<AboutUsScreen />);
    expect(screen.getByTestId("about-us-screen")).toBeTruthy();
    for (const key of [
      "navAboutUs",
      "aboutUsParagraph1",
      "aboutUsParagraph2",
      "aboutUsNumbersTitle",
      "aboutUsWhyUsHeading1",
      "aboutUsWhyUsHeading2",
      "aboutUsWhyUsParagraph",
      "aboutUsWhyUsTitle",
      "aboutUsWhyUsDescription",
    ]) {
      expect(screen.getByText(key, { exact: false })).toBeTruthy();
    }
  });

  it("renders the 4 why-us cards", () => {
    renderWithProviders(<AboutUsScreen />);
    for (const n of ["", "2", "3", "4"]) {
      expect(screen.getByText(`aboutUsWhyUsCardTitle${n}`)).toBeTruthy();
      expect(screen.getByText(`aboutUsWhyUsCardDescription${n}`)).toBeTruthy();
    }
  });
});
