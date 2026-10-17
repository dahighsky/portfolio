import { noise } from "./geom.js";

const f = q => q[0].toFixed(1) + " " + q[1].toFixed(1);

// An ink stroke in the manner of {Shan, Shui}*: a filled polygon around the
// polyline whose width tapers with sin(πt) and wobbles with noise.
// Returns an SVG path "d", or "" if fewer than 2 distinct points remain.
export function brush(pts, wid, seed = 0) {
  const p = [pts[0]];
  for (const q of pts) {
    const last = p[p.length - 1];
    if (Math.hypot(q[0] - last[0], q[1] - last[1]) > 0.35) p.push(q);
  }
  if (p.length < 2) return "";
  const L = [0];
  for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
  const tot = L[L.length - 1], A = [], B = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    // max(0, …): float error makes sin(π·1) slightly negative, and a negative base to a fractional power is NaN
    const taper = 0.18 + 0.82 * Math.pow(Math.max(0, Math.sin(Math.PI * L[i] / tot)), 0.55);
    const w = wid * taper * (0.7 + 0.6 * noise(L[i] * 0.06, seed)) / 2;
    A.push([p[i][0] - dy / l * w, p[i][1] + dx / l * w]);
    B.push([p[i][0] + dy / l * w, p[i][1] - dx / l * w]);
  }
  return "M" + A.map(f).join("L") + "L" + B.reverse().map(f).join("L") + "Z";
}
