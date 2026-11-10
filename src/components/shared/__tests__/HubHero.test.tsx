/**
 * HubHero — render test (HubHero, HubSearchBox, HubTabBar).
 *
 * HubHero takes its own `t` and `isRtl` as props (not from the hook), plus
 * tabBarSlot / searchSlot React nodes. We assert the breadcrumb labels, title,
 * and that the slots render.
 */

import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text as RNText } from "react-native";
import {
  HubHero,
  HubSearchBox,
  HubTabBar,
} from "@/components/shared/HubHero";

const t = (k: string) => k;

describe("HubHero", () => {
  it("renders title and both slots, with no breadcrumb (tab root screen)", () => {
    render(
      <HubHero
        homeLabelKey="tabs.home"
        trailingBreadcrumbLabel="Program Explorer"
        title="Find your program"
        t={t}
        isRtl={false}
        tabBarSlot={<RNText>TABS_SLOT</RNText>}
        searchSlot={<RNText>SEARCH_SLOT</RNText>}
      />
    );
    // No breadcrumb on bottom-tab root screens (you're already on the page).
    expect(screen.queryByText("tabs.home")).toBeNull();
    expect(screen.queryByText("Program Explorer")).toBeNull();
    expect(screen.getByText("Find your program")).toBeTruthy();
    expect(screen.getByText("TABS_SLOT")).toBeTruthy();
    expect(screen.getByText("SEARCH_SLOT")).toBeTruthy();
  });
});

describe("HubSearchBox", () => {
  it("renders the placeholder and value and fires onChange on text input", () => {
    const onChange = jest.fn();
    render(
      <HubSearchBox value="hello" onChange={onChange} placeholder="Search…" />
    );
    const field = screen.getByPlaceholderText("Search…");
    expect(field.props.value).toBe("hello");
    fireEvent.changeText(field, "world");
    expect(onChange).toHaveBeenCalledWith("world");
  });
});

describe("HubTabBar", () => {
  const tabs = [
    { key: "a", label: "Tab A" },
    { key: "b", label: "Tab B" },
    { key: "c", label: "Tab C", disabled: true },
  ];

  it("renders all tab labels", () => {
    render(
      <HubTabBar tabs={tabs} active="a" onChange={jest.fn()} isRtl={false} />
    );
    expect(screen.getByText("Tab A")).toBeTruthy();
    expect(screen.getByText("Tab B")).toBeTruthy();
    expect(screen.getByText("Tab C")).toBeTruthy();
  });

  it("calls onChange with the tab key when an enabled tab is pressed", () => {
    const onChange = jest.fn();
    render(
      <HubTabBar tabs={tabs} active="a" onChange={onChange} isRtl={false} />
    );
    fireEvent.press(screen.getByText("Tab B"));
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("does NOT call onChange when a disabled tab is pressed", () => {
    const onChange = jest.fn();
    render(
      <HubTabBar tabs={tabs} active="a" onChange={onChange} isRtl={false} />
    );
    fireEvent.press(screen.getByText("Tab C"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("marks the active tab as selected via accessibilityState", () => {
    render(
      <HubTabBar tabs={tabs} active="b" onChange={jest.fn()} isRtl={false} />
    );
    const tabB = screen.getByText("Tab B").parent;
    // The Pressable carries accessibilityState; walk up to find the tab role node.
    const selectedTab = screen.getAllByRole("tab").find(
      (node) => node.props.accessibilityState?.selected === true
    );
    expect(selectedTab).toBeTruthy();
    expect(tabB).toBeTruthy();
  });
});
