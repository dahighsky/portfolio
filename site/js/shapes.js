// Detail shapes. Each returns a polyline ([x, y][]) or a list of polylines,
// drawn in absolute scene coordinates; scenes pass them to add(parent, pts, …).
import { N, rng, noise, lerp, clamp } from "./geom.js";

/** Closed, slightly lumpy ellipse: leaves, rocks, knots. */
export const blob = (cx, cy, rx, ry, seed, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = i / n * Math.PI * 2, r = 0.75 + 0.5 * noise(i * 0.9 + seed * 3, seed);
  return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
});

/** Shan-shui broadleaf tree: a wavering trunk with alternating leaf blobs. */
export function tree(x, y, h, seed) {
  const r = rng(seed * 7 + 3), out = [[[x, y], [x + (r() - 0.5) * 4, y - h * 0.5], [x + (r() - 0.5) * 5, y - h]]];
  for (let k = 0; k < 5; k++) {
    const t = 0.35 + k * 0.14, s = k % 2 ? 1 : -1;
    out.push(blob(x + s * h * 0.14 * (1 - t * 0.5), y - h * t, h * 0.16 * (1.1 - t * 0.6), h * 0.07, seed + k));
  }
  return out;
}

/** Pine: straight trunk with drooping paired branches. */
export function pine(x, y, h) {
  const out = [[[x, y], [x, y - h]]];
  for (let k = 1; k <= 6; k++) {
    const t = k / 7, w = h * 0.32 * (1 - t) + 3, yy = y - h * t;
    out.push([[x - w, yy + w * 0.35], [x - w * 0.4, yy + w * 0.05], [x, yy]], [[x, yy], [x + w * 0.4, yy + w * 0.05], [x + w, yy + w * 0.35]]);
  }
  return out;
}

/** A distant bird. */
export const vbird = (x, y, s = 6) => [[x - s, y - s * 0.4], [x - s * 0.35, y - s * 0.1], [x, y], [x + s * 0.35, y - s * 0.1], [x + s, y - s * 0.4]];

/** Circular arc from angle a0 to a1. */
export const arc = (cx, cy, r, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
  const a = lerp(a0, a1, i / n); return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});

/**
 * Short contour strokes in the band between lines La and Lb over s ∈ [s0, s1],
 * denser near the edges: the {Shan, Shui}* texture() idea. Strokes near La go to
 * parents[0], strokes near Lb to parents[1].
 */
export function texture(add, La, Lb, s0, s1, parents, seed, count = 60, maxF = 0.45) {
  const r = rng(seed);
  for (let k = 0; k < count; k++) {
    const f = Math.pow(r(), 1.8) * maxF, side = r() < 0.5, s = lerp(s0, s1, r()), len = 0.03 + r() * 0.05;
    const pts = [];
    for (let u = 0; u <= 6; u++) {
      const i = Math.round(clamp(s + len * u / 6) * (N - 1)), a = La[i], b = Lb[i], ff = side ? f : 1 - f;
      pts.push([lerp(a[0], b[0], ff) + (noise(u * 0.7 + k, seed) - 0.5) * 2, lerp(a[1], b[1], ff)]);
    }
    add(side ? parents[0] : parents[1], pts, "tex", 0.9 + r() * 0.6);
  }
}
