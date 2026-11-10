/**
 * QA 2026-11-10: in Arabic the Profile Information headings and field labels
 * were left-aligned while the inputs were right-aligned.
 */
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { FieldLabel, SectionHeading } from "@/screens/profile/tabs/ProfileInformationTab";
import { DateField } from "@/components/ui/date-field";

let mockRtl = true;
jest.mock("@/hooks/useCustomTranslation", () => ({
  useCustomTranslation: () => ({ t: (k: string) => k, i18n: { language: "x" }, lang: "x", isRtl: mockRtl }),
}));

const flat = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style) ?? {};

describe("Profile labels follow the reading direction", () => {
  it("RTL: label row runs right-to-left and the heading is right-aligned", () => {
    mockRtl = true;
    render(<><FieldLabel label="الاسم" required /><SectionHeading label="الهوية" /></>);
    expect(flat("field-label").flexDirection).toBe("row-reverse");
    expect(flat("section-heading").textAlign).toBe("right");
  });

  it("RTL: the date field label row too (Date of Birth stayed left)", () => {
    mockRtl = true;
    render(<DateField label="تاريخ الميلاد" required value={null} onChange={jest.fn()} />);
    expect(flat("date-field-label").flexDirection).toBe("row-reverse");
  });

  it("LTR: unchanged", () => {
    mockRtl = false;
    render(<><FieldLabel label="Name" required /><SectionHeading label="Identity" /></>);
    expect(flat("field-label").flexDirection).toBe("row");
    expect(flat("section-heading").textAlign).toBe("left");
  });
});
