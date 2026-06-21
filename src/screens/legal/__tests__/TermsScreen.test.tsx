/**
 * TermsScreen — static legal content render smoke test.
 *
 * Pure presentational screen built entirely from `terms.*` i18n keys; no API
 * calls. With the global t() stub returning the key unchanged, every section
 * title renders as its key string. Para/Bullet skip rendering only when their
 * text is falsy — here t() always returns a non-empty key, so all show.
 */

import { render, screen } from "@testing-library/react-native";
import TermsScreen from "@/screens/legal/TermsScreen";

describe("TermsScreen", () => {
  it("mounts without throwing and renders the page heading", () => {
    render(<TermsScreen />);
    expect(screen.getByText("terms.heading")).toBeTruthy();
  });

  it("renders all five section titles plus the conclusion", () => {
    render(<TermsScreen />);
    expect(screen.getByText("terms.section1.title")).toBeTruthy();
    expect(screen.getByText("terms.section2.title")).toBeTruthy();
    expect(screen.getByText("terms.section3.title")).toBeTruthy();
    expect(screen.getByText("terms.section4.title")).toBeTruthy();
    expect(screen.getByText("terms.section5.title")).toBeTruthy();
    expect(screen.getByText("terms.conclusionTitle")).toBeTruthy();
  });

  it("renders representative sub-titles and body paragraphs", () => {
    render(<TermsScreen />);
    expect(screen.getByText("terms.section1.sub1.title")).toBeTruthy();
    expect(screen.getByText("terms.section1.intro")).toBeTruthy();
    expect(screen.getByText("terms.section2.sub1.text")).toBeTruthy();
    expect(screen.getByText("terms.conclusion.text")).toBeTruthy();
  });

  it("renders bullet list items", () => {
    render(<TermsScreen />);
    expect(screen.getByText("terms.section1.sub1.bullet1")).toBeTruthy();
    expect(screen.getByText("terms.section2.sub1.item6")).toBeTruthy();
    // The literal bullet glyph renders once per Bullet row.
    expect(screen.getAllByText("•").length).toBeGreaterThan(0);
  });
});
