import { P, rng, lerp, catmull } from "../geom.js";
import { blob, arc, vbird, put, tree } from "../shapes.js";

// Open source: a commit graph whose branches peel off main and merge back, and
// which, read as a whole, is a tree: branches above, a trunk and roots below.
// The scroll ends in a landscape, where it began.
export default {
  id: "oss",
  title: "Open source",
  lines: [
    { ctrl: [[200, 10], [140, 60], [86, 140], [72, 300], [82, 460], [130, 560], [176, 640], [182, 712], [150, 860]] },
    { ctrl: [[200, 40], [168, 92], [150, 160], [150, 284], [176, 352], [200, 392], [184, 444], [162, 506], [172, 622], [188, 712], [182, 860]] },
    { ctrl: [[200, 0], [200, 320], [200, 620], [201, 860]], rough: 1, seed: 91 },
    { ctrl: [[200, 150], [232, 204], [250, 266], [250, 420], [224, 482], [200, 512], [216, 566], [230, 624], [214, 712], [218, 860]] },
    { ctrl: [[200, 90], [270, 160], [328, 244], [334, 420], [318, 520], [262, 600], [224, 664], [218, 712], [252, 860]] },
  ],
  decorate(L, add) {
    const R = rng(91);
    // commits: small knots along every line through the graph
    for (const k of [0, 1, 2, 3, 4]) for (let s = 0.08; s < 0.72; s += 0.085) {
      const q = P(L[k], s + (k % 2) * 0.03); add(k, blob(q[0], q[1], 4.5, 4.5, k * 10 + s * 50, 8), "det", 1.2);
    }
    // merge marks where the feature branches come home, and a release tag on main
    for (const [k, y] of [[1, 392], [3, 512]]) add(2, arc(200, y, 9, 0, Math.PI * 2, 14), "det", 1);
    put(add, 2, [[[200, 300], [200, 276]], [[200, 276], [218, 282], [200, 288]]], "det", 1.1);
    put(add, 2, [[[200, 180], [200, 160]], [[200, 160], [214, 165], [200, 170]]], "det", 1.1);
    // foliage clusters on the outer branches: the graph read as a tree
    for (const [k, s0, s1, side] of [[0, 0.08, 0.6, -1], [4, 0.08, 0.62, 1], [1, 0.1, 0.5, -1], [3, 0.12, 0.5, 1]]) {
      for (let s = s0; s < s1; s += 0.06) {
        const q = P(L[k], s);
        for (let j = 0; j < 4; j++) {
          const x = q[0] + side * (8 + R() * 26), y = q[1] + (R() - 0.5) * 30;
          add(k, blob(x, y, 7 + R() * 5, 3 + R() * 2, R() * 99, 9), R() < 0.35 ? "pale" : "tex", 1.2);
        }
      }
    }
    // trunk bark and roots
    for (let y = 724; y < 840; y += 9) add(2, [[192 + R() * 16, y], [192 + R() * 16, y + 6]], "tex", 1);
    for (const [x0, x1] of [[176, 120], [182, 160], [220, 250], [226, 290]]) add(x0 < 200 ? 0 : 4, catmull([[x0, 820], [lerp(x0, x1, 0.5), 838], [x1, 852]]), "det", 1.1);
    add(2, [[0, 844], [400, 844]], "tex", 1);
    for (let x = 14; x < 400; x += 26) if (Math.abs(x - 200) > 70) add(x < 200 ? 0 : 4, [[x, 844], [x + 2, 834]], "tex", 1);
    // the first scene, echoed: far ridges, a moon, birds
    add(0, catmull([[0, 610], [26, 576], [50, 592], [76, 560], [108, 600]]), "pale", 1.5);
    add(4, catmull([[290, 606], [322, 566], [350, 586], [376, 552], [404, 596]]), "pale", 1.5);
    add(4, arc(352, 64, 18, 0, Math.PI * 2, 22), "pale", 1.3);
    add(0, vbird(60, 40)); add(0, vbird(82, 28, 5));
  },
  // wide screens: a forest grows out to either side
  wings(L, add) {
    for (const [x, h] of [[-640, 160], [-460, 220], [-260, 180], [-100, 120]]) tree(x, 844, h, -x).forEach(p => add(0, p, "pale"));
    for (const [x, h] of [[480, 140], [620, 240], [780, 170], [940, 130]]) tree(x, 844, h, x).forEach(p => add(4, p, "pale"));
    add(0, [[-1100, 844], [0, 844]], "tex", 1); add(4, [[400, 844], [1400, 844]], "tex", 1);
    add(0, catmull([[-1100, 640], [-860, 560], [-620, 610], [-400, 540], [-120, 600]]), "pale", 1.5);
    add(4, catmull([[440, 600], [640, 540], [860, 580], [1100, 520], [1400, 580]]), "pale", 1.5);
    add(4, vbird(540, 120)); add(4, vbird(570, 106, 5));
  },
};
