import { N, rng, lerp, noise, catmull } from "../geom.js";
import { vbird, pine } from "../shapes.js";

// An alpine peak in pen and ink: jagged skylines (lines 0 and 1), three ridges
// falling from the summit (2, the accent, then 3 and 4), shadow faces filled with
// dense parallel hatching that breaks where the pen lifts, lit faces with sparse
// dashes, and dark rock bands under each ridge.

// A crisp, jagged line through the given points: each segment gets a few
// seeded kinks so ridges read as rock, not curves.
function jagged(pts, seed, amp = 7, kinks = 3) {
  const r = rng(seed), out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
    for (let k = 1; k <= kinks; k++) {
      const t = k / (kinks + 1), j = (r() - 0.5) * 2 * amp * Math.min(1, l / 60);
      out.push([ax + dx * t - dy / l * j, ay + dy * t + dx / l * j]);
    }
    out.push(pts[i]);
  }
  return out;
}

const S = [205, 112]; // summit

// x of a top-to-bottom line at height y (nearest sample), or null outside its span.
function xAt(L, y) {
  if (y < L[0][1] - 1 || y > L[N - 1][1] + 1) return null;
  let b = 0;
  for (let i = 1; i < N; i++) if (Math.abs(L[i][1] - y) < Math.abs(L[b][1] - y)) b = i;
  return L[b][0];
}

// Parallel hatching across the face between a ridge (from) and a boundary (to):
// from each point along the ridge a stroke runs in direction dir until it meets
// the boundary, broken into pen-lifted segments. density: share of rows drawn.
// facets: leave seeded bands unhatched, so the face breaks into lit slabs and shadowed ones.
function hatchFace(add, L, from, to, dir, { s0 = 0.02, s1 = 0.98, step = 3.4, seed = 1, maxLen = 260, tone = "det", wid = 0.8, density = 1, fade = 0, facets = 0 } = {}) {
  const r = rng(seed), A = L[from], B = to == null ? null : L[to];
  const [dx, dy] = (l => [dir[0] / l, dir[1] / l])(Math.hypot(...dir));
  for (let i = Math.round(s0 * (N - 1)); i < s1 * (N - 1); i += step * (0.7 + r() * 0.6)) {
    if (r() > density) continue;
    if (facets && noise(i * 0.06, seed) < facets) continue;
    const st = A[Math.round(i)], seg = [];
    let len = 0, x = st[0] + dx * 2, y = st[1] + dy * 2;
    const limit = maxLen * (0.55 + r() * 0.45) * (1 - fade * i / N);
    while (len < limit) {
      // past the end of the boundary line, keep going (to the frame edge or the stroke's length)
      const bx = B && y <= B[N - 1][1] ? xAt(B, y) : null;
      if (B && bx === null && y < B[0][1]) break;
      if (bx !== null && (dx < 0 ? x <= bx + 2 : x >= bx - 2)) break;
      if (y > 862 || x < -40 || x > 440) break;
      seg.push([x, y]);
      x += dx * 3; y += dy * 3; len += 3;
      if (seg.length > 3 && r() < 0.035) { add(from, seg.splice(0), tone, wid); } // pen lift
    }
    if (seg.length > 1) add(from, seg, tone, wid);
  }
}

// Sparse short dashes for sunlit snow between two lines.
function dashes(add, L, a, b, parent, count, seed, dir = [0.55, 1]) {
  const r = rng(seed), l = Math.hypot(...dir), ux = dir[0] / l, uy = dir[1] / l;
  for (let k = 0; k < count; k++) {
    const y = lerp(Math.max(L[a][0][1], L[b][0][1]) + 10, 860, Math.pow(r(), 0.8));
    const xa = xAt(L[a], y), xb = xAt(L[b], y);
    if (xa == null || xb == null) continue;
    const x = lerp(xa, xb, 0.1 + r() * 0.8), n = 4 + r() * 10;
    add(parent, [[x, y], [x + ux * n, y + uy * n]], r() < 0.6 ? "tex" : "det", 0.7);
  }
}

export default {
  id: "mountains",
  title: "Mountains",
  lines: [
    { ctrl: jagged([S, [176, 172], [158, 186], [140, 246], [104, 280], [86, 330], [44, 372], [22, 430], [-12, 500]], 2, 8), smooth: false },
    { ctrl: jagged([S, [236, 170], [258, 212], [292, 246], [326, 326], [350, 338], [380, 404], [412, 438]], 3, 7), smooth: false },
    { ctrl: jagged([S, [192, 196], [176, 270], [150, 352], [122, 446], [86, 552], [48, 676], [14, 860]], 4, 9, 4), smooth: false },
    { ctrl: jagged([[238, 172], [232, 262], [214, 352], [188, 456], [168, 566], [156, 700], [148, 860]], 5, 8, 4), smooth: false },
    { ctrl: jagged([[326, 326], [304, 430], [284, 540], [270, 650], [272, 860]], 6, 7, 4), smooth: false },
  ],
  decorate(L, add) {
    // the big shadow face west of the accent ridge: dense hatching down to the left skyline
    hatchFace(add, L, 2, 0, [-0.62, 1], { seed: 11, step: 1.7, wid: 1, maxLen: 300, facets: 0.3, fade: 0.45 });
    hatchFace(add, L, 2, 0, [-0.62, 1], { s1: 0.5, seed: 17, step: 2.6, wid: 0.9, maxLen: 90, density: 0.9 }); // the dark core under the summit
    hatchFace(add, L, 2, 0, [-0.4, 1], { seed: 16, step: 3.4, wid: 0.7, maxLen: 160, density: 0.6, tone: "tex" }); // a second, cross-angled pass
    // shadow under ridge 3 (its west flank), fading into the lit face toward ridge 2
    hatchFace(add, L, 3, 2, [-0.5, 1], { seed: 13, step: 2.4, wid: 0.9, maxLen: 80, density: 0.9, facets: 0.25 });
    // shadow under ridge 4, and a band of rock under the right skyline's shoulder
    hatchFace(add, L, 4, 3, [-0.45, 1], { seed: 14, step: 2.6, wid: 0.9, maxLen: 60, density: 0.9, facets: 0.25 });
    hatchFace(add, L, 1, 4, [-0.35, 1], { s0: 0.42, s1: 0.62, seed: 15, step: 3.2, wid: 0.75, maxLen: 40 });
    // spurs: short rocky ridgelets running down-right off the ridges, each with a hatched shadow beneath
    const sr = rng(51);
    for (const [k, s0] of [[2, 0.18], [2, 0.42], [3, 0.2], [3, 0.46], [3, 0.7], [4, 0.25], [4, 0.55], [1, 0.3], [1, 0.62]]) {
      const q = L[k][Math.round(s0 * (N - 1))], len = 40 + sr() * 50, ang = 0.55 + sr() * 0.35;
      const spur = jagged([q, [q[0] + Math.cos(ang) * len * (k === 1 ? -0.6 : 1), q[1] + Math.sin(ang) * len]], 60 + k * 7 + s0 * 100, 4, 3);
      add(k, spur, "det", 1.1);
      for (let t = 0.1; t < 0.95; t += 0.07) {
        const a = [lerp(spur[0][0], spur[spur.length - 1][0], t), lerp(spur[0][1], spur[spur.length - 1][1], t)], h = 8 + sr() * 22 * (1 - t);
        add(k, [[a[0] - 1, a[1] + 2], [a[0] - h * 0.45, a[1] + h]], "det", 0.8);
      }
    }
    // sunlit snow: sparse dashes on the faces east of each ridge
    dashes(add, L, 2, 3, 3, 70, 21);
    dashes(add, L, 3, 4, 4, 60, 22);
    dashes(add, L, 4, 1, 1, 50, 23);
    // rock steps along the ridges: short dark ticks just under each crest
    const r = rng(31);
    for (const k of [1, 3, 4]) for (let i = 8; i < N - 8; i += 7 + Math.floor(r() * 9)) {
      const q = L[k][i], n = 6 + r() * 10;
      add(k, [[q[0] - 1, q[1] + 2], [q[0] - n * 0.5, q[1] + n]], "det", 0.9);
      add(k, [[q[0] + 3, q[1] + 3], [q[0] - n * 0.3, q[1] + n * 0.8]], "det", 0.7);
    }
    // a dark couloir near the summit, and cornice ticks on the summit ridge
    for (let k = 0; k < 14; k++) add(2, [[198 - k * 1.2, 150 + k * 7], [184 - k * 1.6, 168 + k * 7]], "det", 0.8);
    for (let k = 0; k < 6; k++) add(1, [[212 + k * 4, 126 + k * 7], [214 + k * 4, 134 + k * 7]], "det", 0.9);
    // far ranges, pale, and a few birds
    add(0, catmull([[0, 220], [30, 196], [56, 210], [86, 182], [120, 214]]), "pale", 1.5);
    add(1, catmull([[290, 196], [318, 170], [344, 186], [372, 156], [404, 190]]), "pale", 1.5);
    for (const [x, y, s] of [[300, 96, 7], [322, 84, 5], [340, 104, 4]]) add(1, vbird(x, y, s));
  },
  // wide screens: lesser peaks either side, drawn the same way but lighter
  wings(L, add) {
    const peak = (cx, top, w, base, parent, seed) => {
      const r = rng(seed), left = jagged([[cx, top], [cx - w * 0.5, top + (base - top) * 0.45], [cx - w, base]], seed, 6), right = jagged([[cx, top], [cx + w * 0.45, top + (base - top) * 0.5], [cx + w, base]], seed + 1, 6);
      add(parent, left, "det", 1.4); add(parent, right, "det", 1.4);
      for (let y = top + 6; y < base; y += 4) { // hatch the west face
        const t = (y - top) / (base - top), xs = cx - w * t * 0.98, xe = cx - w * t * 0.25;
        if (r() < 0.8) add(parent, [[xe, y], [lerp(xs, xe, r() * 0.4), y + (xe - xs) * 0.5]], "tex", 0.7);
      }
      for (let k = 0; k < 18; k++) { const y = lerp(top + 20, base, r()), x = cx + w * ((y - top) / (base - top)) * r() * 0.8; add(parent, [[x, y], [x + 4, y + 7]], "tex", 0.7); }
    };
    peak(-420, 300, 220, 640, 0, 41);
    peak(-760, 380, 180, 660, 0, 42);
    peak(620, 260, 240, 620, 4, 43);
    peak(980, 360, 200, 660, 4, 44);
    add(0, catmull([[-1100, 300], [-900, 250], [-700, 280], [-520, 220], [-300, 270], [-100, 240], [0, 250]]), "pale", 1.6);
    add(4, catmull([[400, 230], [560, 180], [760, 220], [960, 160], [1200, 230], [1400, 200]]), "pale", 1.6);
  },
  bullet: (x, y) => pine(x, y + 11, 22),
};
