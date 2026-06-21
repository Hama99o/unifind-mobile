/**
 * StatTile — render test.
 *
 * Renders an icon chip, a verbatim value string, and a translated label
 * (t(labelKey) — the mock returns the key unchanged).
 */

import { render, screen } from "@testing-library/react-native";
import { Users } from "lucide-react-native";
import { StatTile } from "@/components/shared/StatTile";

describe("StatTile", () => {
  it("renders the value verbatim and the label via the translation key", () => {
    render(<StatTile Icon={Users} value="12,000" labelKey="stats.students" />);
    expect(screen.getByText("12,000")).toBeTruthy();
    // t() mock returns the key string unchanged.
    expect(screen.getByText("stats.students")).toBeTruthy();
  });

  it("renders an empty value string without crashing", () => {
    render(<StatTile Icon={Users} value="" labelKey="stats.empty" />);
    expect(screen.getByText("stats.empty")).toBeTruthy();
  });
});
