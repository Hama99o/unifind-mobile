/**
 * IconCircle — render test.
 *
 * A circular View container that renders its children and sizes itself by the
 * `size` prop (default 40). className is inert under jest; we assert on
 * children presence and the resolved width/height style.
 */

import { render, screen } from "@testing-library/react-native";
import { View, Text as RNText } from "react-native";
import { IconCircle } from "@/components/shared/IconCircle";

describe("IconCircle", () => {
  it("renders its children", () => {
    render(
      <IconCircle>
        <RNText>child</RNText>
      </IconCircle>
    );
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("defaults to a 40px square", () => {
    render(
      <IconCircle>
        <RNText>x</RNText>
      </IconCircle>
    );
    const view = screen.UNSAFE_getByType(View);
    expect(view.props.style).toEqual({ width: 40, height: 40 });
  });

  it("applies an explicit size to width and height", () => {
    render(
      <IconCircle size={36}>
        <RNText>x</RNText>
      </IconCircle>
    );
    const view = screen.UNSAFE_getByType(View);
    expect(view.props.style).toEqual({ width: 36, height: 36 });
  });
});
