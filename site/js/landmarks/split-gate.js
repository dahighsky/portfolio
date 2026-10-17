import { N, P, catmull, lerp } from "../geom.js";
import { blob, tree, vbird, put } from "../shapes.js";

const TOP = 226, SHOULDER = 300, BASE = 560;

// One edge of a tiered tower, from the spire down: each tier steps outward with a ledge.
function towerEdge(cx, side, tiers, foot) {
  const h = (BASE - SHOULDER) / tiers, pts = [[cx, TOP]];
  for (let t = 0; t < tiers; t++) {
    const x = cx + side * (14 + t * 12 * 4 / tiers), y = SHOULDER + t * h;
    pts.push([x, y], [x + side * 6, y]);
  }
  const last = pts[pts.length - 1][0];
  pts.push([last, BASE], ...foot(last));
  return pts;
}
const mirror = pts => pts.map(([x, y]) => [400 - x, y]);
const atY = (L, y) => { const i = L.findIndex(q => q[1] >= y); return L[i < 0 ? N - 1 : i]; };

splitGate.params = ["tiers"];

// Candi bentar: a gate split in two, the accent line running up the stair path between.
export default function splitGate({ tiers = 4 } = {}) {
  if (!Number.isInteger(tiers) || tiers < 1 || tiers > 8)
    throw new Error(`destination.landmark.params.tiers must be an integer 1–8, got ${JSON.stringify(tiers)}`);
  const outer = towerEdge(124, -1, tiers, x => [[x - 10, 700], [40, 860]]);
  const inner = towerEdge(124, 1, tiers, x => [[x - 10, 700], [150, 860]]);
  const lines = [
    { ctrl: outer, smooth: false },
    { ctrl: inner, smooth: false },
    { ctrl: [[200, 540], [198, 620], [200, 700], [200, 780], [198, 860]], rough: 1, seed: 33 },
    { ctrl: mirror(inner), smooth: false },
    { ctrl: mirror(outer), smooth: false },
  ];
  const h = (BASE - SHOULDER) / tiers;
  function decorate(L, add) {
    for (const [a, b] of [[0, 1], [3, 4]]) {
      for (let t = 0; t <= tiers; t++) { const y = SHOULDER + t * h + 1; add(a, [atY(L[a], y), atY(L[b], y)], "det", 1.4); }
      for (let t = 0; t < tiers; t++) for (let y = SHOULDER + t * h + 9; y < SHOULDER + (t + 1) * h - 4; y += 11) { // carved bands
        const qa = atY(L[a], y), qb = atY(L[b], y), zz = [];
        for (let u = 0.14, n = 0; u <= 0.86; u += 0.08, n++) zz.push([lerp(qa[0], qb[0], u), y + (n % 2 ? 3 : -2)]);
        add(a, zz, "tex", 1);
      }
      const top = L[a][0];
      add(a, [[top[0], top[1]], [top[0], top[1] - 26]]); add(a, blob(top[0], top[1] - 30, 5, 5, a + 1, 10));
    }
    add(2, catmull([[150, 250], [178, 190], [200, 176], [222, 190], [250, 250]]), "pale", 1.8); // volcano behind
    add(2, catmull([[198, 170], [190, 150], [204, 128], [194, 104]]), "pale", 1.2);
    add(2, catmull([[60, 160], [80, 150], [110, 154], [124, 162]]), "pale", 1.2);
    add(2, catmull([[280, 120], [300, 110], [330, 114], [346, 122]]), "pale", 1.2);
    for (let s = 0.02; s < 0.6; s += 0.05) { const q = P(L[2], s), w = 26 + s * 60; add(2, [[q[0] - w, q[1]], [q[0] + w, q[1]]], "det", 1.1); } // stair treads
    for (const [k, s, dx] of [[0, 0.85, -10], [0, 0.62, -30], [4, 0.85, 10], [4, 0.62, 30]]) { const q = P(L[k], s); tree(q[0] + dx, q[1] + 20, 40, k + s * 10).forEach(t => add(k, t)); }
    for (const [k, dx] of [[1, 24], [3, -24]]) { const q = P(L[k], 0.9); add(k, blob(q[0] + dx, q[1], 8, 4, k * 3, 10)); add(k, [[q[0] + dx, q[1] - 4], [q[0] + dx, q[1] - 14]], "det", 0.8); } // offerings
    add(2, vbird(170, 120)); add(2, vbird(232, 96, 5));
  }
  // wide screens: rice terraces stepping away to the left, palms and a shrine to the right
  function wings(L, add) {
    for (let k = 0; k < 7; k++) { const y = 420 + k * 56; add(0, catmull([[-1100, y + 20], [-800, y - 10], [-500, y + 14], [-200, y - 6], [0, y + 10]]), k % 2 ? "tex" : "det", 1.1); }
    for (let k = 0; k < 18; k++) { const x = -1000 + k * 55, y = 470 + (k % 7) * 56; add(0, [[x, y], [x + 4, y - 10]], "tex", 1); }
    for (const x of [470, 640]) { const b = 690;
      add(4, Array.from({ length: 10 }, (_, i) => { const t = i / 9; return [x - 24 * t * t, b - 240 * t]; }));
      const top = [x - 24, b - 240];
      for (const [dx, dy] of [[-80, 30], [-60, 70], [70, 24], [80, 66], [0, 70]]) add(4, [top, [top[0] + dx * 0.5, top[1] + dy * 0.2 - 20], [top[0] + dx, top[1] + dy]]); }
    put(add, 4, [[[740, 600], [800, 560], [860, 600]], [[750, 600], [750, 660], [850, 660], [850, 600]], [[790, 660], [790, 630], [810, 630], [810, 660]]], "det", 1.1);
    add(0, catmull([[-700, 220], [-560, 140], [-500, 130], [-380, 230]]), "pale", 1.6);
  }
  const anchors = L => [L[0][0], L[3][0], P(L[2], 0.3)];
  return { lines, decorate, wings, anchors };
}
