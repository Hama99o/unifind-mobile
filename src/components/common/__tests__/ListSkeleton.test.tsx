/**
 * ListSkeleton — render tests.
 *
 * Source: src/components/common/ListSkeleton.tsx
 *
 * Behaviour traced from source:
 * - The "program", "institution" and "offering" variants each render 3 bone cards
 *   inside a single outer <View>.
 * - The default (no/unknown variant) renders 4 generic bone blocks.
 * - Renders a non-null tree in every case.
 *
 * The root toJSON node is the outer container <View>; its children array length
 * equals the number of bone rows rendered, which is the deterministic signal we
 * assert on (className is an inert prop under jest, so we don't assert on it).
 */

import { render } from "@testing-library/react-native";
import { ListSkeleton } from "@/components/common/ListSkeleton";

/** Number of direct children of the root container node. */
function rootChildCount(tree: ReturnType<ReturnType<typeof render>["toJSON"]>): number {
  if (!tree || Array.isArray(tree)) {
    throw new Error("expected a single root node");
  }
  const kids = (tree as { children?: unknown[] }).children;
  return Array.isArray(kids) ? kids.length : 0;
}

describe("ListSkeleton", () => {
  it("renders 3 bone rows for the 'program' variant", () => {
    const { toJSON } = render(<ListSkeleton variant="program" />);
    expect(rootChildCount(toJSON())).toBe(3);
  });

  it("renders 3 bone rows for the 'institution' variant", () => {
    const { toJSON } = render(<ListSkeleton variant="institution" />);
    expect(rootChildCount(toJSON())).toBe(3);
  });

  it("renders 3 bone rows for the 'offering' variant", () => {
    const { toJSON } = render(<ListSkeleton variant="offering" />);
    expect(rootChildCount(toJSON())).toBe(3);
  });

  it("renders 4 generic bone blocks when no variant is given", () => {
    const { toJSON } = render(<ListSkeleton />);
    expect(rootChildCount(toJSON())).toBe(4);
  });

  it("renders 4 generic bone blocks for an unknown variant", () => {
    // @ts-expect-error — intentionally passing an out-of-union value to hit the default branch
    const { toJSON } = render(<ListSkeleton variant="mystery" />);
    expect(rootChildCount(toJSON())).toBe(4);
  });

  it("always renders a non-null tree", () => {
    const { toJSON } = render(<ListSkeleton variant="program" />);
    expect(toJSON()).not.toBeNull();
  });
});
