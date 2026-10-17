import { lerp, clamp, smooth } from "./geom.js";

// Phase windows inside one transition (local = p − k):
// rest · melt old detail · flow the five lines · grow new detail · rest.
const MELT = [0.08, 0.24], FLOW = [0.30, 0.40], GROW = [0.68, 0.24];
const STAGGER = 0.06, FLOW_WINDOW = 0.76, DETAIL_WINDOW = 0.55;
const phase = (local, [start, len]) => clamp((local - start) / len);

function place(det, lines, g, out) {
  for (const d of det) {
    const gg = smooth(clamp((g - d.delay) / DETAIL_WINDOW));
    if (gg <= 0.001) continue;
    const L = lines[d.parent];
    out.push({ tone: d.tone, wid: d.wid * (0.4 + 0.6 * gg), seed: d.seed, pts: d.pts.map(([i, dx, dy]) => [L[i][0] + dx * gg, L[i][1] + dy * gg]) });
  }
}

// The drawing at scroll progress p. Depends only on (scenes, p).
export function frameAt(scenes, p) {
  const last = scenes.length - 1;
  p = Number.isFinite(p) ? Math.max(0, Math.min(last, p)) : 0;
  if (p === last) {
    const strokes = [];
    place(scenes[last].det, scenes[last].lines, 1, strokes);
    return { k: last, local: 0, mains: scenes[last].lines, strokes };
  }
  const k = Math.floor(p), local = p - k, A = scenes[k], B = scenes[k + 1];
  const flow = phase(local, FLOW);
  const mains = A.lines.map((la, i) => {
    const m = smooth(clamp((flow - i * STAGGER) / FLOW_WINDOW));
    if (m === 0) return la;
    const lb = B.lines[i];
    return la.map((q, j) => [lerp(q[0], lb[j][0], m), lerp(q[1], lb[j][1], m)]);
  });
  const strokes = [];
  place(A.det, mains, 1 - phase(local, MELT), strokes);
  place(B.det, mains, phase(local, GROW), strokes);
  return { k, local, mains, strokes };
}
