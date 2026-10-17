// Geometry shared by every scene: seeded randomness, smooth noise, and lines
// resampled to N points by arc length so any two lines interpolate point for point.

export const N = 240;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = v => Math.max(0, Math.min(1, v));
export const smooth = t => t * t * (3 - 2 * t);

export function rng(seed) {
  let s = Math.max(1, Math.floor(Math.abs(seed)) % 2147483647);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// Smooth 1D value noise in [0, 1].
export function noise(x, seed = 0) {
  const h = n => { const t = Math.sin((n + seed * 131.7) * 127.1) * 43758.5453; return t - Math.floor(t); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u);
}

export function catmull(ctrl, steps = 16) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[i - 1] || ctrl[i], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[i + 2] || p2;
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push([...ctrl[ctrl.length - 1]]);
  return out;
}

export function linear(ctrl, steps = 12) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++)
    for (let s = 0; s < steps; s++)
      out.push([lerp(ctrl[i][0], ctrl[i + 1][0], s / steps), lerp(ctrl[i][1], ctrl[i + 1][1], s / steps)]);
  out.push([...ctrl[ctrl.length - 1]]);
  return out;
}

// n points spaced evenly along the polyline's length.
export function resample(pts, n) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1], out = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const t = total * k / (n - 1);
    while (j < L.length - 1 && L[j] < t) j++;
    const seg = L[j] - L[j - 1], u = seg > 0 ? (t - L[j - 1]) / seg : 1;
    out.push([lerp(pts[j - 1][0], pts[j][0], u), lerp(pts[j - 1][1], pts[j][1], u)]);
  }
  return out;
}

// A main line: smooth (or straight-segmented) through ctrl, N points, optionally
// roughened along its normal so cliff edges read as hand-drawn.
export function makeLine({ ctrl, smooth: sm = true, rough = 0, seed = 1 }) {
  const p = resample(sm ? catmull(ctrl) : linear(ctrl), N);
  if (!rough) return p;
  return p.map((q, i) => {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(N - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const d = rough * ((noise(i * 0.09, seed) - 0.5) * 2 + 0.4 * (noise(i * 0.4, seed + 9) - 0.5));
    return [q[0] - dy / l * d, q[1] + dx / l * d];
  });
}

// Point at fraction s along a line.
export const P = (L, s) => L[Math.round(clamp(s) * (L.length - 1))];
