/**
 * RankingCard — render + press (Linking.openURL) test.
 *
 * Renders the category title and the position prefixed with "#". When a url is
 * provided it becomes a Pressable (accessibilityRole="link") opening the url,
 * prefixing https:// for bare domains.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { Linking } from "react-native";
import { RankingCard } from "@/components/shared/RankingCard";

describe("RankingCard", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
  });

  it("renders the title and the position with a leading '#'", () => {
    render(<RankingCard title="QS World Ranking" position={5} />);
    expect(screen.getByText("QS World Ranking")).toBeTruthy();
    expect(screen.getByText("#5")).toBeTruthy();
  });

  it("supports a string position", () => {
    render(<RankingCard title="Top" position="12th" />);
    expect(screen.getByText("#12th")).toBeTruthy();
  });

  it("is not a link when no url is provided", () => {
    render(<RankingCard title="Top" position={1} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("opens the url (prefixing https:// for a bare domain) when pressed", () => {
    render(<RankingCard title="Top" position={1} url="rankings.example" />);
    fireEvent.press(screen.getByRole("link"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://rankings.example");
  });

  it("keeps an absolute https url unchanged when pressed", () => {
    render(
      <RankingCard title="Top" position={1} url="https://rankings.example/x" />
    );
    fireEvent.press(screen.getByRole("link"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://rankings.example/x");
  });
});
