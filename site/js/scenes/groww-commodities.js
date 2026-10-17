import { P, catmull } from "../geom.js";
import { blob, arc, rect, cylinder, goldBar, ellipse, vbird, put } from "../shapes.js";

// Commodities: lines 0 and 1 meet at the top of an oil derrick, the accent line
// carries crude down into barrels, lines 3 and 4 frame a stack of gold bars.
export default {
  id: "groww-commodities",
  title: "Commodities",
  lines: [
    { ctrl: [[120, 110], [100, 250], [76, 400], [54, 520], [40, 640], [28, 860]] },
    { ctrl: [[120, 110], [140, 250], [164, 400], [186, 520], [198, 600], [214, 860]] },
    { ctrl: [[120, 140], [120, 380], [122, 560], [160, 640], [200, 720], [236, 760], [250, 860]], rough: 1, seed: 52 },
    { ctrl: [[322, 270], [300, 380], [278, 480], [262, 560], [250, 860]] },
    { ctrl: [[322, 270], [344, 380], [366, 480], [384, 560], [404, 860]] },
  ],
  decorate(L, add) {
    // derrick: crown block, rungs and cross-bracing between the two legs
    put(add, 0, [rect(110, 96, 20, 14)], "det", 1.3);
    let prev = null;
    for (let y = 150; y <= 520; y += 37) {
      const a = L[0].find(q => q[1] >= y), b = L[1].find(q => q[1] >= y);
      add(y % 2 ? 0 : 1, [a, b], "det", 1.1);
      if (prev) { add(0, [prev[0], b], "tex", 1); add(1, [prev[1], a], "tex", 1); }
      prev = [a, b];
    }
    add(0, [[40, 520], [200, 520]], "det", 1.6); // drilling floor
    // pump jack beside the derrick
    { const x = 60, y = 840;
      put(add, 0, [[[x, y], [x + 20, y - 50], [x + 40, y]], [[x - 26, y - 56], [x + 66, y - 44]], ellipse(x - 30, y - 50, 9, 13), [[x + 66, y - 44], [x + 66, y]], [[x - 40, y], [x + 80, y]]], "det", 1.2); }
    // crude dripping along the pipe, and a valve where it turns
    for (let s = 0.08; s < 0.45; s += 0.07) { const q = P(L[2], s); add(2, blob(q[0] + 8, q[1], 2.5, 4, s * 30, 8), "det", 1); }
    { const q = P(L[2], 0.58); put(add, 2, [ellipse(q[0], q[1] - 10, 9, 9), [[q[0] - 9, q[1] - 10], [q[0] + 9, q[1] - 10]], [[q[0], q[1] - 19], [q[0], q[1] - 26]]], "det", 1.1); }
    // barrels: a stack of three and one more, where the pipe ends
    for (const [cx, y] of [[214, 800], [258, 800], [302, 800], [236, 752], [280, 752]]) put(add, cx < 250 ? 2 : 3, cylinder(cx, y, 38, 44, 2), "det", 1.1);
    put(add, 2, [[[180, 852], [340, 852]]], "tex", 0.9);
    // gold: a pyramid of bars between lines 3 and 4, with a glint on top
    const rows = [[1, 290], [2, 344], [3, 398], [4, 452], [5, 506]];
    for (const [n, y] of rows) {
      const a = L[3].find(q => q[1] >= y + 30), b = L[4].find(q => q[1] >= y + 30), w = (b[0] - a[0]) / n;
      for (let i = 0; i < n; i++) put(add, i < n / 2 ? 3 : 4, goldBar(a[0] + i * w + 2, y + 14, w - 4, 18), "det", 1.1);
    }
    { const x = 322, y = 286; put(add, 3, [[[x, y - 14], [x, y - 2]], [[x - 6, y - 8], [x + 6, y - 8]], [[x - 4, y - 12], [x + 4, y - 4]], [[x + 4, y - 12], [x - 4, y - 4]]], "det", 1); }
    // distant oilfield and sun, pale
    for (const x of [214, 236]) add(1, [[x - 8, 560], [x, 524 + (x % 3) * 8], [x + 8, 560]], "pale", 1.3);
    add(4, [[196, 562], [410, 562]], "pale", 1.2);
    add(1, arc(236, 170, 24, 0, Math.PI * 2, 24), "pale", 1.4);
    add(1, vbird(250, 160)); add(1, vbird(272, 148, 5));
    // a gold coin and an oil drop as quiet emblems, low left
    add(0, catmull([[30, 560], [24, 576], [30, 586], [36, 576], [30, 560]]), "det", 1.2);
  },
  // wide screens: the oilfield and the vault carry on
  wings(L, add) {
    for (const [x, h] of [[-560, 80], [-380, 110], [-200, 70]]) add(0, [[x - 18, 560], [x, 560 - h], [x + 18, 560]], "pale", 1.3);
    add(0, [[-1100, 562], [0, 562]], "pale", 1.2);
    for (const x of [-480, -300]) { const y = 840; put(add, 0, [[[x, y], [x + 16, y - 40], [x + 32, y]], [[x - 18, y - 46], [x + 56, y - 36]], ellipse(x - 22, y - 42, 7, 10)], "det", 1.1); }
    for (const [cx, w] of [[500, 120], [680, 90]]) put(add, 4, cylinder(cx, 600, w, 160, 3), "det", 1.1);
    for (let r = 0; r < 3; r++) for (let i = 0; i <= r; i++) put(add, 4, goldBar(560 + i * 44 - r * 22, 780 + r * 26 - 52, 40, 16), "det", 1);
    add(4, [[400, 852], [1400, 852]], "tex", 1); add(0, [[-1100, 852], [0, 852]], "tex", 1);
    add(4, arc(760, 140, 30, 0, Math.PI * 2, 24), "pale", 1.4);
  },
  anchors: L => [[120, 100], [322, 280], [258, 760], [80, 800]],
};
