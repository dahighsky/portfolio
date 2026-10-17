import { P, catmull } from "../geom.js";
import { blob, tree, pine, vbird, arc, texture } from "../shapes.js";

// A hanging-scroll peak: lines 0 and 1 meet at the summit, the accent line is a
// waterfall that becomes a river, lines 3 and 4 a lower peak to the right.
export default {
  id: "mountains",
  title: "Mountains",
  lines: [
    { ctrl: [[180, 90], [160, 160], [124, 250], [110, 330], [76, 420], [54, 520], [26, 640], [8, 750], [-6, 860]], rough: 5, seed: 2 },
    { ctrl: [[180, 90], [204, 160], [214, 230], [238, 300], [250, 380], [232, 450], [262, 520], [302, 560], [350, 600], [410, 640]], rough: 4, seed: 3 },
    { ctrl: [[250, 382], [249, 430], [236, 480], [210, 540], [192, 620], [206, 700], [184, 780], [172, 860]], rough: 2, seed: 4 },
    { ctrl: [[334, 300], [316, 350], [306, 410], [296, 470], [300, 540]], rough: 3, seed: 5 },
    { ctrl: [[334, 300], [352, 340], [378, 384], [412, 420]], rough: 3, seed: 6 },
  ],
  decorate(L, add) {
    texture(add, L[0], L[1], 0.04, 0.55, [0, 1], 11, 90, 0.42);
    texture(add, L[3], L[4], 0.05, 0.9, [3, 4], 12, 30, 0.4);
    add(0, catmull([[0, 250], [30, 215], [55, 232], [84, 196], [118, 240]]), "pale", 1.6);
    add(1, catmull([[260, 230], [292, 190], [318, 214], [350, 170], [400, 226]]), "pale", 1.6);
    add(1, vbird(260, 120)); add(1, vbird(282, 108, 5)); add(1, vbird(300, 128, 4));
    add(4, arc(350, 150, 22, 0, Math.PI * 2, 24), "pale", 1.4);
    for (const s of [0.22, 0.3, 0.38, 0.47, 0.55]) { const q = P(L[0], s); tree(q[0] + 16, q[1] + 6, 26 + s * 30, s * 100).forEach(t => add(0, t)); }
    for (const s of [0.25, 0.4]) { const q = P(L[1], s); pine(q[0] - 10, q[1] + 4, 30).forEach(t => add(1, t)); }
    for (const s of [0.2, 0.5, 0.8]) { const q = P(L[3], s); pine(q[0] + 10, q[1] + 6, 24).forEach(t => add(3, t)); }
    for (let k = 0; k < 6; k++) {
      const q = P(L[2], 0.02 + k * 0.025);
      add(2, [[q[0] - 8, q[1]], [q[0] - 3, q[1] + 10]], "det", 0.8);
      add(2, [[q[0] + 8, q[1]], [q[0] + 3, q[1] + 10]], "det", 0.8);
    }
    for (let s = 0.45; s < 0.95; s += 0.06) {
      const q = P(L[2], s);
      add(2, [[q[0] - 26, q[1] + 4], [q[0] - 10, q[1] + 2]], "det", 0.8);
      add(2, [[q[0] + 10, q[1] + 3], [q[0] + 28, q[1] + 5]], "det", 0.8);
    }
    { // pavilion by the river
      const q = P(L[2], 0.62), x = q[0] - 70, y = q[1] + 10;
      add(2, catmull([[x - 30, y - 38], [x - 14, y - 42], [x, y - 52], [x + 14, y - 42], [x + 30, y - 38]]));
      add(2, [[x - 30, y - 38], [x - 34, y - 44]], "det", 1);
      add(2, [[x - 20, y - 40], [x - 20, y]]); add(2, [[x + 20, y - 40], [x + 20, y]]); add(2, [[x - 28, y], [x + 28, y]]);
    }
    { // a boat with a fisherman
      const q = P(L[2], 0.88), x = q[0] + 40, y = q[1];
      add(2, catmull([[x - 24, y - 4], [x - 12, y + 4], [x + 12, y + 4], [x + 24, y - 4]]));
      add(2, [[x + 2, y - 2], [x + 2, y - 14]]); add(2, blob(x + 2, y - 17, 3, 3, 9, 8)); add(2, [[x + 4, y - 10], [x + 30, y - 34]], "det", 0.8);
    }
    for (const s of [0.6, 0.95]) { const q = P(L[3], s); add(3, blob(q[0] + 18, q[1] + 12, 14, 8, s * 10)); }
  },
  // wide screens: the ranges carry on either side
  wings(L, add) {
    add(0, catmull([[-1100, 330], [-900, 250], [-760, 290], [-560, 200], [-380, 270], [-200, 230], [0, 250]]), "pale", 1.8);
    add(1, catmull([[400, 220], [520, 160], [640, 220], [780, 140], [940, 230], [1140, 170], [1400, 240]]), "pale", 1.8);
    add(4, [[430, 560], [520, 420], [560, 452], [640, 300], [700, 380], [760, 340], [880, 560]], "det", 1.6);
    for (let k = 0; k < 40; k++) { const x = 500 + (k * 37) % 340, y = 430 + (k * 53) % 120; add(4, [[x, y], [x - 6, y + 16]], "tex", 1); }
    for (const x of [520, 600, 700, 800]) pine(x, 560 - (x % 3) * 8, 26).forEach(p => add(4, p));
    add(0, [[-1100, 700], [-860, 610], [-640, 660], [-420, 590], [-200, 650], [0, 620]], "det", 1.3);
    for (const x of [-840, -620, -400, -180]) tree(x, 640 - (x % 5) * 6, 40, -x).forEach(p => add(0, p));
    for (let x = -1000; x < -40; x += 90) add(0, [[x, 760], [x + 50, 760]], "pale", 1);
    add(4, [[400, 700], [520, 720], [700, 690], [900, 730], [1300, 700]], "det", 1.2);
    for (const x of [460, 640, 820]) tree(x, 712, 46, x).forEach(p => add(4, p));
    for (const [x, y, s] of [[-300, 120, 7], [-270, 108, 5], [620, 90, 7]]) add(x < 0 ? 0 : 4, vbird(x, y, s));
  },
};
