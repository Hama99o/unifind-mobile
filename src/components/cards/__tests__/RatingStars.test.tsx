/**
 * RatingStars — star-rating display.
 *
 * The component renders `max` lucide <Star> icons. Each Star is forwarded a
 * `fill` prop on its root <Svg> host node:
 *   - filled star: fill = colors.accent  → the mocked useColors has NO `accent`
 *                  key, so this is `undefined` (the source reads a missing key —
 *                  a benign quirk; we assert ACTUAL behaviour).
 *   - empty star : fill = "transparent"
 * `filled = Math.round(value)` decides how many of the first `max` are filled.
 *
 * Under jest, react-native-svg is mocked to render plain "Svg" host elements,
 * and lucide-react-native is real, so we can count Star nodes via the rendered
 * JSON tree and inspect each one's `fill` prop.
 */

import { render } from "@testing-library/react-native";
import { RatingStars } from "@/components/cards/RatingStars";

type JsonNode = {
  type?: string;
  props?: Record<string, unknown>;
  children?: unknown;
} | string | null;

/** Recursively collect every rendered "Svg" host node (each lucide Star). */
function collectSvgNodes(node: JsonNode, acc: Array<Record<string, unknown>> = []) {
  if (!node || typeof node === "string") return acc;
  if (node.type === "Svg") acc.push(node.props ?? {});
  const kids = node.children;
  if (Array.isArray(kids)) {
    kids.forEach((k) => collectSvgNodes(k as JsonNode, acc));
  }
  return acc;
}

function starFills(value: number, extra?: { max?: number }) {
  const { toJSON } = render(<RatingStars value={value} {...extra} />);
  const stars = collectSvgNodes(toJSON() as JsonNode);
  return stars.map((s) => s.fill);
}

describe("RatingStars", () => {
  it("renders 5 stars by default", () => {
    expect(starFills(3)).toHaveLength(5);
  });

  it("renders `max` stars when max is provided", () => {
    expect(starFills(2, { max: 3 })).toHaveLength(3);
  });

  it("fills the first Math.round(value) stars; the rest are transparent", () => {
    // value 3 → 3 filled (fill undefined), 2 empty (fill 'transparent')
    const fills = starFills(3);
    expect(fills).toEqual([undefined, undefined, undefined, "transparent", "transparent"]);
  });

  it("rounds .5 up (3.5 → 4 filled)", () => {
    const fills = starFills(3.5);
    expect(fills.filter((f) => f === "transparent")).toHaveLength(1);
    expect(fills.filter((f) => f !== "transparent")).toHaveLength(4);
  });

  it("rounds down below .5 (3.4 → 3 filled)", () => {
    const fills = starFills(3.4);
    expect(fills.filter((f) => f === "transparent")).toHaveLength(2);
    expect(fills.filter((f) => f !== "transparent")).toHaveLength(3);
  });

  it("renders all stars transparent for value 0", () => {
    expect(starFills(0)).toEqual([
      "transparent",
      "transparent",
      "transparent",
      "transparent",
      "transparent",
    ]);
  });

  it("renders all stars filled for value 5", () => {
    const fills = starFills(5);
    expect(fills.every((f) => f !== "transparent")).toBe(true);
    expect(fills).toHaveLength(5);
  });

  it("clamps display to `max` even when value exceeds max (no extra stars)", () => {
    // value 5, max 3 → only 3 stars rendered, all filled
    const fills = starFills(5, { max: 3 });
    expect(fills).toHaveLength(3);
    expect(fills.every((f) => f !== "transparent")).toBe(true);
  });
});
