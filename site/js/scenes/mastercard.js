import { rng, catmull } from "../geom.js";
import { rect, plane, gear, cylinder, ellipse, arc, put } from "../shapes.js";

// An ETL pipeline, top to bottom. Records stream in from many industries
// (extract), are squeezed through a transform stage, pair off at the matching
// stage (lines 0+1 and 3+4 merge), then load into data stores.
const M0 = 412, M1 = 528; // matching stage
export default {
  id: "mastercard",
  title: "ETL and matching",
  lines: [
    { ctrl: [[40, 0], [44, 190], [96, 320], [148, M0], [148, M1], [96, 640], [62, 860]] },
    { ctrl: [[120, 0], [122, 190], [138, 320], [151, M0], [151, M1], [138, 640], [132, 860]] },
    { ctrl: [[200, 0], [200, 300], [200, 600], [200, 860]], rough: 1, seed: 71 },
    { ctrl: [[280, 0], [278, 190], [262, 320], [249, M0], [249, M1], [262, 640], [268, 860]] },
    { ctrl: [[360, 0], [356, 190], [304, 320], [252, M0], [252, M1], [304, 640], [338, 860]] },
  ],
  decorate(L, add) {
    const R = rng(71);
    // extract: one source per stream: a shop, a plane, a server, a fuel pump, a cart
    put(add, 0, [[[18, 52], [62, 52]], arc(24, 52, 5.5, 0, Math.PI, 6), arc(35, 52, 5.5, 0, Math.PI, 6), arc(46, 52, 5.5, 0, Math.PI, 6), arc(57, 52, 5.5, 0, Math.PI, 6), rect(22, 60, 36, 26), rect(34, 70, 10, 16)], "det", 1.1);
    put(add, 1, plane(120, 64, 22, Math.PI), "det", 1.3);
    put(add, 2, [rect(184, 40, 32, 46), [[188, 52], [212, 52]], [[188, 63], [212, 63]], [[188, 74], [212, 74]]], "det", 1.1);
    put(add, 3, [rect(266, 46, 22, 40), rect(270, 52, 14, 10), [[288, 56], [296, 60], [296, 80], [292, 86]]], "det", 1.1);
    put(add, 4, [[[338, 52], [346, 52], [352, 76], [380, 76], [384, 60], [348, 60]], ellipse(356, 84, 3, 3), ellipse(376, 84, 3, 3)], "det", 1.1);
    // batches: stacked record ticks arriving down each stream
    for (const k of [0, 1, 2, 3, 4]) for (const y0 of [112, 162]) {
      const q = L[k].find(q => q[1] >= y0);
      for (let i = 0; i < 4; i++) add(k, [[q[0] + 7, q[1] + i * 5], [q[0] + 17, q[1] + i * 5]], i % 2 ? "tex" : "det", 1);
    }
    // many more, fainter streams from everywhere, converging on the funnel
    for (let i = 0; i < 9; i++) { const x0 = 10 + i * 46 + R() * 10, x1 = 168 + i * 8;
      add(i < 4 ? 0 : i < 5 ? 2 : 4, catmull([[x0, 0], [x0 + (x1 - x0) * 0.2, 150], [x1, 300], [x1, M0 - 20]]), "pale", 0.9); }
    // transform: the stage frame, two gears and a third half-hidden
    put(add, 2, [[[14, 236], [386, 236]], [[14, 336], [386, 336]]], "tex", 1);
    put(add, 0, gear(70, 286, 22, 9), "det", 1.1);
    put(add, 0, gear(104, 262, 13, 7), "det", 1);
    put(add, 4, gear(330, 288, 24, 10), "det", 1.1);
    // matching: record pairs bracketed together beside each merge; strays drift out
    for (let y = M0 + 10; y < M1 - 4; y += 26) {
      put(add, 0, [rect(110, y, 12, 8), rect(110, y + 11, 12, 8), [[107, y + 2], [104, y + 2], [104, y + 17], [107, y + 17]]], "det", 0.9);
      put(add, 4, [rect(278, y, 12, 8), rect(278, y + 11, 12, 8), [[293, y + 2], [296, y + 2], [296, y + 17], [293, y + 17]]], "det", 0.9);
    }
    for (const [k, x, y, dx] of [[0, 70, 440, -40], [0, 60, 500, -30], [4, 330, 450, 40], [4, 340, 510, 34]]) {
      put(add, k, [rect(x, y, 12, 8)], "det", 0.9);
      for (let i = 1; i <= 3; i++) add(k, [[x + 6 - dx * i / 4, y + 4], [x + 6 - dx * i / 4 + 2, y + 4]], "tex", 1.4);
    }
    add(2, [[160, M0 - 6], [240, M0 - 6]], "tex", 1); add(2, [[160, M1 + 6], [240, M1 + 6]], "tex", 1);
    // load: into data stores at the foot of every stream
    for (const [k, x] of [[0, 62], [1, 132], [2, 200], [3, 268], [4, 338]]) {
      put(add, k, cylinder(x, 760, 46, 22), "det", 1.1);
      put(add, k, cylinder(x, 790, 46, 22), "det", 1.1);
      put(add, k, cylinder(x, 820, 46, 22), "det", 1.1);
    }
    // the clock that runs the batch jobs
    put(add, 4, [ellipse(360, 200, 14, 14), [[360, 200], [360, 191]], [[360, 200], [367, 204]]], "pale", 1.3);
  },
  // wide screens: more sources pouring in from the sides, more stores below
  wings(L, add) {
    for (let i = 0; i < 6; i++) { const x0 = -700 + i * 110; add(0, catmull([[x0, 0], [x0 + 60, 180], [60, 340], [130, 412]]), "pale", 0.9); }
    for (let i = 0; i < 6; i++) { const x0 = 520 + i * 70; add(4, catmull([[x0, 0], [x0 - 40, 180], [340, 340], [270, 412]]), "pale", 0.9); }
    for (const x of [-560, -340]) { add(0, rect(x, 40, 34, 46), "det", 1); add(0, [[x + 4, 54], [x + 30, 54]], "tex", 1); }
    put(add, 4, plane(560, 60, 22, Math.PI), "det", 1.2);
    put(add, 4, [rect(680, 46, 30, 40), [[684, 58], [706, 58]]], "det", 1);
    for (const x of [-480, -360, 520, 640]) for (const y of [760, 790, 820]) put(add, x < 0 ? 0 : 4, cylinder(x, y, 46, 22), "pale", 1.1);
    put(add, 4, [ellipse(560, 300, 18, 18), [[560, 300], [560, 288]], [[560, 300], [568, 306]]], "pale", 1.3);
  },
  anchors: () => [[62, 790], [132, 790], [200, 790], [268, 790], [338, 790]],
};
