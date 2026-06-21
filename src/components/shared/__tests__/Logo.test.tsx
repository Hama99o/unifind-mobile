/**
 * Logo — render + dimension-resolution test.
 *
 * The Logo renders a single RN <Image>. Under jest the asset require() resolves
 * to a number/object handled by the RN test renderer. We assert on the resolved
 * style dimensions (width/height) the component computes, plus a11y props.
 */

import { render, screen } from "@testing-library/react-native";
import { Image } from "react-native";
import { Logo } from "@/components/shared/Logo";

// Aspect ratios from the source (width / height).
const RATIO = {
  white: 610 / 181,
  prussian: 241 / 84,
  mark: 367 / 128,
};

/** Flatten the style array the component passes ([{width,height}, style]). */
function getImageStyle() {
  const img = screen.UNSAFE_getByType(Image);
  const flat = Array.isArray(img.props.style)
    ? Object.assign({}, ...img.props.style.filter(Boolean))
    : img.props.style;
  return flat as { width: number; height: number };
}

describe("Logo", () => {
  it("renders an accessible image labelled 'UniFind'", () => {
    render(<Logo />);
    const img = screen.UNSAFE_getByType(Image);
    expect(img.props.accessibilityLabel).toBe("UniFind");
    expect(img.props.accessibilityRole).toBe("image");
    expect(img.props.resizeMode).toBe("contain");
  });

  it("defaults to prussian variant at height 28, width derived from ratio", () => {
    render(<Logo />);
    const { width, height } = getImageStyle();
    expect(height).toBe(28);
    expect(width).toBeCloseTo(28 * RATIO.prussian, 5);
  });

  it("derives width from an explicit height (height-only path)", () => {
    render(<Logo variant="white" height={32} />);
    const { width, height } = getImageStyle();
    expect(height).toBe(32);
    expect(width).toBeCloseTo(32 * RATIO.white, 5);
  });

  it("derives height from an explicit width (width-only path)", () => {
    render(<Logo variant="mark" width={120} />);
    const { width, height } = getImageStyle();
    expect(width).toBe(120);
    expect(height).toBeCloseTo(120 / RATIO.mark, 5);
  });

  it("respects both width and height when both are provided (no forced ratio)", () => {
    render(<Logo variant="prussian" width={200} height={50} />);
    const { width, height } = getImageStyle();
    expect(width).toBe(200);
    expect(height).toBe(50);
  });
});
