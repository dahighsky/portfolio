import { P, noise, rng, catmull } from "../geom.js";
import { tree, vbird, arc, blob } from "../shapes.js";

// A bay seen from the cliffs: tree line, dry sand, the water's edge (accent),
// then two lines of breakers, all running off the top and bottom of the screen.
const bay = (x, y) => [x + 36 * Math.sin(y / 860 * Math.PI * 1.4 + 0.3), y];
const col = (x0, wob, seed) => Array.from({ length: 12 }, (_, i) => bay(x0 + wob * (noise(i * 0.8, seed) - 0.5), -10 + i * 80));

export default {
  id: "coast",
  title: "Coast",
  lines: [
    { ctrl: col(70, 30, 21), rough: 4, seed: 21 },
    { ctrl: col(138, 16, 22), rough: 2, seed: 22 },
    { ctrl: col(196, 10, 23).map(([x, y], i) => [x + (i % 2 ? 7 : -7), y]), rough: 3, seed: 23 },
    { ctrl: col(262, 22, 24), rough: 5, seed: 24 },
    { ctrl: col(330, 26, 25), rough: 6, seed: 25 },
  ],
  decorate(L, add) {
    for (let s = 0.05; s < 0.98; s += 0.09) { const q = P(L[0], s); tree(q[0] - 22, q[1] + 10, 22 + ((s * 100) % 9) * 2, s * 77).forEach(t => add(0, t)); }
    for (const s of [0.18, 0.42, 0.66, 0.84]) { // umbrellas from above, with towels
      const q = P(L[1], s), x = q[0] + 26, y = q[1];
      add(1, arc(x, y, 11, 0, Math.PI * 2, 18));
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; add(1, [[x, y], [x + 11 * Math.cos(a), y + 11 * Math.sin(a)]], "det", 0.7); }
      add(1, [[x + 16, y + 4], [x + 30, y + 2], [x + 31, y + 10], [x + 17, y + 12], [x + 16, y + 4]], "det", 0.8);
    }
    for (let s = 0.1; s < 0.9; s += 0.025) { // footprints along the water's edge
      const q = P(L[2], s), o = Math.round(s * 400) % 2 * 5;
      add(2, [[q[0] - 12 + o, q[1]], [q[0] - 11 + o, q[1] + 3]], "det", 1.2);
    }
    for (const k of [3, 4]) for (let s = 0.02; s < 1; s += 0.04) { const q = P(L[k], s); add(k, arc(q[0] - 5, q[1], 5, -Math.PI / 2, Math.PI / 2, 6), "tex", 1); }
    for (const [s, dx] of [[0.25, 40], [0.6, 30], [0.8, 50]]) { // boats offshore, with wakes
      const q = P(L[4], s), x = q[0] + dx, y = q[1];
      add(4, catmull([[x, y - 16], [x + 6, y - 4], [x + 6, y + 10], [x, y + 16], [x - 6, y + 10], [x - 6, y - 4], [x, y - 16]]));
      add(4, [[x, y + 18], [x - 4, y + 40]], "tex", 0.7);
    }
    add(0, catmull([[0, 40], [40, 20], [90, 34], [130, 10]]), "pale", 1.4);
    add(4, vbird(330, 90)); add(4, vbird(352, 78, 5));
  },
  // wide screens: more shore to the left, open sea to the right
  wings(L, add) {
    const R = rng(23);
    for (let i = 0; i < 26; i++) { const x = -60 - R() * 640, y = 20 + R() * 820; tree(x, y, 18 + R() * 22, i).forEach(p => add(0, p, R() < 0.5 ? "pale" : "tex")); }
    for (const [x, y] of [[-200, 220], [-360, 520], [-140, 700]]) { add(0, [[x - 26, y], [x, y - 20], [x + 26, y]]); add(0, [[x - 20, y], [x - 20, y + 22], [x + 20, y + 22], [x + 20, y]]); }
    for (let i = 0; i < 46; i++) { const x = 440 + R() * 420, y = R() * 860; add(4, arc(x, y, 8 + R() * 6, Math.PI * 1.1, Math.PI * 1.9, 6), "tex", 1); }
    for (const [x, y] of [[520, 160], [680, 420], [560, 680]]) { add(4, catmull([[x, y - 16], [x + 6, y - 4], [x + 6, y + 10], [x, y + 16], [x - 6, y + 10], [x - 6, y - 4], [x, y - 16]])); add(4, [[x, y + 18], [x - 4, y + 44]], "tex", 0.8); }
    add(4, blob(760, 300, 40, 18, 7), "pale", 1.4); add(4, blob(820, 560, 26, 12, 9), "pale", 1.4);
    add(4, vbird(560, 60)); add(4, vbird(590, 48, 5)); add(0, vbird(-300, 80));
  },
};
