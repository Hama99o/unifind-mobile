/**
 * Horizontal scroll offset that reveals `item` in a scroller of `viewport`
 * width over `content` width, moving as little as possible (plus `margin`)
 * and clamped to the content bounds. Used to keep the active tab visible.
 */
export function scrollXToReveal(
  item: { x: number; width: number },
  current: number,
  viewport: number,
  content: number,
  margin = 0
): number {
  const max = Math.max(0, content - viewport);
  let next = current;
  if (item.x + item.width > current + viewport) next = item.x + item.width - viewport + margin;
  else if (item.x < current) next = item.x - margin;
  return Math.min(max, Math.max(0, next));
}
