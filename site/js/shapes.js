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

// ---------- shapes for the work scenes ----------

/** Rectangle outline, closed. */
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

/** Rounded rectangle outline, closed. */
export function rrect(x, y, w, h, r) {
  const c = (cx, cy, a) => arc(cx, cy, r, a, a + Math.PI / 2, 5);
  return [...c(x + w - r, y + r, -Math.PI / 2), ...c(x + w - r, y + h - r, 0), ...c(x + r, y + h - r, Math.PI / 2), ...c(x + r, y + r, Math.PI), [x + w - r, y]];
}

/** Ellipse (or part of one) from angle a0 to a1. */
export const ellipse = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 20) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });

const rot = (pts, x, y, a) => pts.map(([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]);

/** Airliner seen from above, nose pointing along angle a (0 = down the screen). */
export function plane(x, y, s, a = 0) {
  const parts = [
    [[0, -9], [0, 9]],                                   // fuselage
    [[-8, -1], [0, 1.5], [8, -1]],                       // swept wings
    [[-3, -8], [0, -7], [3, -8]],                        // tailplane
  ].map(p => p.map(([px, py]) => [px * s / 9, py * s / 9]));
  return parts.map(p => rot(p, x, y, a));
}

/** Shan-shui cloud: a row of bumps with curled ends. */
export function cloud(x, y, w, seed) {
  const r = rng(seed), out = [], top = [];
  let cx = x;
  while (cx < x + w) { const rr = 7 + r() * 9; top.push(...arc(cx + rr, y, rr, Math.PI, Math.PI * 2, 8)); cx += rr * 1.6; }
  out.push(top);
  out.push([...arc(x + 6, y + 2, 6, Math.PI * 1.5, Math.PI * 0.6, 8)], [[x + 4, y + 7], [cx - 2, y + 7]], arc(cx - 4, y + 2, 5, -Math.PI / 2, Math.PI * 0.5, 8));
  return out;
}

/** Currency glyph as strokes in a ~10×14 box at (x, y), scale s. ch ∈ ₹ $ € £ ¥. */
export function glyph(ch, x, y, s = 1) {
  const g = {
    "$": [[...arc(5, 4.5, 3.5, -0.2, -Math.PI * 1.5, 8), ...arc(5, 9.5, 3.5, -Math.PI / 2, Math.PI * 0.85, 8)], [[5, 0], [5, 14]]],
    "€": [arc(7, 7, 6, -0.8, 0.8 - Math.PI * 2, 12), [[0, 5.5], [7, 5.5]], [[0, 8.5], [7, 8.5]]],
    "£": [[[9, 3], ...arc(6, 4, 3, -0.3, -Math.PI, 6).slice(1), [3, 9], [2, 13], [9, 13]], [[1, 8], [7, 8]]],
    "¥": [[[1, 0], [5, 6], [9, 0]], [[5, 6], [5, 14]], [[1, 7], [9, 7]], [[1, 10], [9, 10]]],
    "₹": [[[1, 1], [9, 1]], [[1, 4.5], [9, 4.5]], [[1, 1], [4, 1], ...arc(4, 4.5, 3.5, -Math.PI / 2, Math.PI / 2, 6), [1, 8], [8, 14]]],
  }[ch];
  return g.map(p => p.map(([px, py]) => [x + px * s, y + py * s]));
}

/** Split-flap tile: outline plus the split. */
export const flap = (x, y, w = 9, h = 13) => [rect(x, y, w, h), [[x, y + h / 2], [x + w, y + h / 2]]];

/** Seven-segment digit (0–9) in a w×h box; "." draws a dot. */
export function digit(d, x, y, w = 6, h = 10) {
  if (d === ".") return [[[x + w / 2, y + h - 0.5], [x + w / 2 + 0.6, y + h]]];
  const seg = { a: [[0, 0], [1, 0]], b: [[1, 0], [1, 0.5]], c: [[1, 0.5], [1, 1]], d: [[0, 1], [1, 1]], e: [[0, 0.5], [0, 1]], f: [[0, 0], [0, 0.5]], g: [[0, 0.5], [1, 0.5]] };
  const on = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abfgcd"][+d];
  return [...on].map(k => seg[k].map(([u, v]) => [x + u * w, y + v * h]));
}

/** Coin seen at an angle: rim and inner rim. */
export const coin = (cx, cy, r) => [ellipse(cx, cy, r, r * 0.45), ellipse(cx, cy, r * 0.7, r * 0.3)];

/** Upright cylinder (barrel, data store) of width w and height h, top at y. */
export function cylinder(cx, y, w, h, hoops = 0) {
  const rx = w / 2, ry = w * 0.16, out = [ellipse(cx, y, rx, ry), [[cx - rx, y], [cx - rx, y + h]], [[cx + rx, y], [cx + rx, y + h]], ellipse(cx, y + h, rx, ry, 0, Math.PI, 12)];
  for (let k = 1; k <= hoops; k++) out.push(ellipse(cx, y + h * k / (hoops + 1), rx, ry, 0, Math.PI, 12));
  return out;
}

/** Gold bar from the side: a trapezoid with its top face. */
export const goldBar = (x, y, w, h) => [[[x, y + h], [x + w * 0.12, y], [x + w * 0.88, y], [x + w, y + h], [x, y + h]], [[x + w * 0.12, y], [x + w * 0.2, y - h * 0.35], [x + w * 0.8, y - h * 0.35], [x + w * 0.88, y]]];

/** Gear with n teeth. */
export function gear(cx, cy, r, n = 8) {
  const pts = [];
  for (let i = 0; i <= n * 4; i++) { const a = i / (n * 4) * Math.PI * 2, rr = (i % 4 < 2) ? r : r * 0.78; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  return [pts, arc(cx, cy, r * 0.3, 0, Math.PI * 2, 10)];
}

/** Add every polyline in a list to the same parent. */
export const put = (add, parent, polys, tone, wid) => polys.forEach(p => add(parent, p, tone, wid));

/** Tick mark. */
export const tick = (x, y, s = 6) => [[x - s * 0.5, y], [x - s * 0.1, y + s * 0.45], [x + s * 0.7, y - s * 0.5]];

/** Approval stamp: double ring with a tick. */
export const stamp = (cx, cy, r) => [arc(cx, cy, r, 0, Math.PI * 2, 18), arc(cx, cy, r * 0.75, 0, Math.PI * 2, 14), tick(cx, cy, r * 0.9)];

/** Small traveller pulling a suitcase. */
export function traveller(x, y, s = 1) {
  const S = pts => pts.map(([px, py]) => [x + px * s, y + py * s]);
  return [
    S(arc(0, -34, 4, 0, Math.PI * 2, 10)), S([[0, -30], [0, -14]]), S([[0, -14], [-4, 0]]), S([[0, -14], [4, 0]]),
    S([[0, -26], [9, -18]]), S([[9, -18], [12, -10]]), S(rect(8, -10, 10, 10)), S([[10, 0], [10, 1.5]]), S([[16, 0], [16, 1.5]]),
  ];
}

// ---------- commodity marks ----------

/** A drop of crude. */
export const oilDrop = (x, y, s = 1) => [[[x, y - 9 * s], [x - 3.5 * s, y - 2 * s], [x - 5.5 * s, y + 2.5 * s], [x - 4 * s, y + 6.5 * s], [x, y + 8 * s], [x + 4 * s, y + 6.5 * s], [x + 5.5 * s, y + 2.5 * s], [x + 3.5 * s, y - 2 * s], [x, y - 9 * s]]];

/** A gas flame, with an inner tongue. */
export const flame = (x, y, s = 1) => [
  [[x - 1 * s, y - 10 * s], [x + 4 * s, y - 3 * s], [x + 6 * s, y + 3 * s], [x + 3 * s, y + 8 * s], [x - 3 * s, y + 8 * s], [x - 6 * s, y + 3 * s], [x - 4 * s, y - 2 * s], [x - 2 * s, y + 1 * s], [x - 1 * s, y - 10 * s]],
  [[x, y - 1 * s], [x + 2.5 * s, y + 4 * s], [x, y + 7 * s], [x - 2.5 * s, y + 4 * s], [x, y - 1 * s]],
];

/** A coil of copper wire. */
export const coil = (x, y, s = 1) => [0, 1, 2].map(k => ellipse(x - 4 * s + k * 4 * s, y, 3.2 * s, 7 * s, 0, Math.PI * 2, 12)).concat([[[x + 4 * s, y + 7 * s], [x + 9 * s, y + 9 * s]]]);

/** Silver: two small bars, one on the other, with a shine mark. */
export const silverBars = (x, y, s = 1) => [...goldBar(x - 9 * s, y + 1 * s, 18 * s, 6 * s), ...goldBar(x - 6 * s, y - 6 * s, 12 * s, 5 * s), [[x + 5 * s, y - 9 * s], [x + 8 * s, y - 12 * s]]];

/** The commodity marks in board order: gold, silver, crude, natural gas, copper. */
export const COMMODITIES = [(x, y, s = 1) => goldBar(x - 9 * s, y - 2 * s, 18 * s, 7 * s), silverBars, oilDrop, flame, coil];

/** Coconut palm: a leaning, ringed trunk, a crown of fronds that rise, arch over and droop,
 *  each feathered with hanging leaflets, and a cluster of coconuts. */
export function palm(x, y, h, seed, fine = true) {
  const r = rng(seed * 13 + 5), lean = (r() - 0.5) * 0.5 * h, out = [];
  const trunk = Array.from({ length: 9 }, (_, i) => { const t = i / 8; return [x + lean * t * t, y - h * t]; });
  out.push(trunk);
  for (let i = 1; i < 8; i++) { const [tx, ty] = trunk[i]; out.push([[tx - h * 0.035, ty], [tx + h * 0.035, ty + h * 0.01]]); } // trunk rings
  const [cx, cy] = trunk[8], n = 6 + Math.floor(r() * 4); // 6–9 fronds, so no two crowns match
  for (let k = 0; k < n; k++) {
    // spread across the top: outer fronds sweep low, inner ones rise first and arch over
    const side = k / (n - 1) * 2 - 1, out_ = Math.abs(side);
    const reach = h * (0.5 + r() * 0.2) * (0.55 + out_ * 0.6), rise = h * 0.28 * (1 - out_ * 0.9), drop = h * (0.22 + out_ * 0.3);
    const spine = Array.from({ length: 8 }, (_, i) => { const t = i / 7; return [cx + side * reach * t, cy - rise * Math.sin(Math.PI * t * 0.8) + drop * t * t]; });
    out.push(spine);
    for (let i = 1; i < 7.5; i += fine ? 0.5 : 1.5) { // short leaflets all along both sides, so the frond reads as feathered
      const a = spine[Math.floor(i)], b = spine[Math.min(7, Math.ceil(i))], f = i % 1, sx = a[0] + (b[0] - a[0]) * f, sy = a[1] + (b[1] - a[1]) * f, l = h * 0.085 * (1 - i / 9);
      out.push([[sx, sy], [sx - side * l * 0.25 - l * 0.22, sy + l]], [[sx, sy], [sx - side * l * 0.25 + l * 0.22, sy + l]]);
    }
  }
  for (const dx of [-0.05, 0.02, 0.07]) out.push(arc(cx + dx * h, cy + h * 0.05, h * 0.032, 0, Math.PI * 2, 8)); // coconuts
  return out;
}
