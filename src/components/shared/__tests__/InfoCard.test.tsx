/**
 * InfoCard — render + press (Linking.openURL) test.
 *
 * Renders title + description. When a url is provided it becomes a Pressable
 * (accessibilityRole="link") that opens the url via Linking.openURL, prefixing
 * "https://" when the url does not already start with "http".
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { Linking, Text as RNText } from "react-native";
import { InfoCard } from "@/components/shared/InfoCard";

describe("InfoCard", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
  });

  it("renders title and description", () => {
    render(<InfoCard title="Website" description="Visit our site" />);
    expect(screen.getByText("Website")).toBeTruthy();
    expect(screen.getByText("Visit our site")).toBeTruthy();
  });

  it("renders the optional icon node", () => {
    render(
      <InfoCard
        title="With Icon"
        description="desc"
        icon={<RNText>ICON</RNText>}
      />
    );
    expect(screen.getByText("ICON")).toBeTruthy();
  });

  it("is NOT a link (no link role) when no url is given", () => {
    render(<InfoCard title="No link" description="desc" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("opens an absolute http url unchanged when pressed", () => {
    render(
      <InfoCard title="Link" description="desc" url="http://example.com" />
    );
    fireEvent.press(screen.getByRole("link"));
    expect(Linking.openURL).toHaveBeenCalledWith("http://example.com");
  });

  it("prefixes https:// to a bare domain url when pressed", () => {
    render(<InfoCard title="Link" description="desc" url="example.com" />);
    fireEvent.press(screen.getByRole("link"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://example.com");
  });
});
