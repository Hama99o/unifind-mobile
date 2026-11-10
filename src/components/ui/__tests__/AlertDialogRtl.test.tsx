/**
 * AlertDialog text follows the reading direction (QA 2026-11-10: in ar the
 * title and message were left-aligned in every confirm dialog).
 */
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { AlertDialog } from "@/components/ui/alert-dialog";

let mockRtl = false;
jest.mock("@/hooks/useCustomTranslation", () => ({
  useCustomTranslation: () => ({ t: (k: string) => k, i18n: { language: "x" }, lang: "x", isRtl: mockRtl }),
}));

const align = (text: string) =>
  (StyleSheet.flatten(screen.getByText(text).props.style) ?? {}).textAlign;

const renderDialog = () =>
  render(
    <AlertDialog isOpen onClose={jest.fn()} title="عنوان" message="رسالة" actions={[{ text: "OK" }]} />
  );

describe("AlertDialog direction", () => {
  it("right-aligns title and message in RTL", () => {
    mockRtl = true;
    renderDialog();
    expect(align("عنوان")).toBe("right");
    expect(align("رسالة")).toBe("right");
  });

  it("left-aligns them in LTR", () => {
    mockRtl = false;
    renderDialog();
    expect(align("عنوان")).toBe("left");
    expect(align("رسالة")).toBe("left");
  });
});
