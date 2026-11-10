/**
 * QA 2026-11-10: in Arabic the Profile tab bar opened scrolled to the far end,
 * with the active tab off-screen. The bar scrolls the active tab into view.
 */
import { scrollXToReveal } from "@/utils/scrollIntoView";

describe("scrollXToReveal", () => {
  const viewport = 400;
  const content = 1200;

  it("keeps the offset when the item is already fully visible", () => {
    expect(scrollXToReveal({ x: 100, width: 150 }, 0, viewport, content)).toBe(0);
  });

  it("scrolls right just enough (plus a margin) to show an item past the right edge", () => {
    expect(scrollXToReveal({ x: 500, width: 150 }, 0, viewport, content, 16)).toBe(500 + 150 - 400 + 16);
  });

  it("scrolls left to show an item before the left edge", () => {
    expect(scrollXToReveal({ x: 100, width: 150 }, 600, viewport, content, 16)).toBe(84);
  });

  it("never scrolls past the content bounds", () => {
    expect(scrollXToReveal({ x: 1100, width: 100 }, 0, viewport, content, 16)).toBe(800);
    expect(scrollXToReveal({ x: 4, width: 100 }, 300, viewport, content, 16)).toBe(0);
  });
});
