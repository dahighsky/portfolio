// Scroll position → scene progress. Each text block names the scene it sits over
// (data-stop); the scene is at rest when that block's centre is at the viewport's.

export function buildStops(blocks, viewportH) {
  return blocks
    .map(b => ({ y: b.top + b.height / 2 - viewportH / 2, k: b.stop }))
    .sort((a, b) => a.y - b.y);
}

export function progressAt(scrollY, stops, count) {
  const max = Math.max(0, count - 1), fit = k => Math.max(0, Math.min(max, k));
  if (!stops.length || !Number.isFinite(scrollY)) return fit(stops[0]?.k ?? 0);
  if (scrollY <= stops[0].y) return fit(stops[0].k);
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1], b = stops[i];
    if (scrollY <= b.y) return fit(b.y > a.y ? a.k + (b.k - a.k) * (scrollY - a.y) / (b.y - a.y) : b.k);
  }
  return fit(stops[stops.length - 1].k);
}
