// Scroll position → scene progress. Each text block names the scene it sits over
// (data-stop); the scene is at rest when that block's centre is at the viewport's.

export function buildStops(blocks, viewportH) {
  return blocks
    .map(b => ({ y: b.top + b.height / 2 - viewportH / 2, k: b.stop }))
    .sort((a, b) => a.y - b.y);
}

// Share of the scroll between two stops during which the drawing holds still at
// each end, so every scene rests at its finished state for a while.
const HOLD = 0.22;

export function progressAt(scrollY, stops, count) {
  const max = Math.max(0, count - 1), fit = k => Math.max(0, Math.min(max, k));
  if (!stops.length || !Number.isFinite(scrollY)) return fit(stops[0]?.k ?? 0);
  if (scrollY <= stops[0].y) return fit(stops[0].k);
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1], b = stops[i];
    if (scrollY > b.y) continue;
    if (b.y <= a.y) return fit(b.k);
    const t = Math.max(0, Math.min(1, ((scrollY - a.y) / (b.y - a.y) - HOLD) / (1 - 2 * HOLD)));
    return fit(a.k + (b.k - a.k) * t);
  }
  return fit(stops[stops.length - 1].k);
}
