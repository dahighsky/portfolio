import { P, catmull } from "../geom.js";
import { blob, vbird, arc, rect, plane, cloud, put, texture } from "../shapes.js";

// Contrails come down out of the clouds and land on a runway seen from above.
// The accent line is the runway centre line; lines 1 and 3 become its edges.
export default {
  id: "flights",
  title: "Flights",
  lines: [
    { ctrl: [[150, 0], [120, 160], [80, 330], [40, 560], [10, 860]], rough: 1.5, seed: 41 },
    { ctrl: [[40, 30], [70, 200], [130, 380], [160, 520], [160, 860]] },
    { ctrl: [[200, 360], [200, 500], [200, 680], [200, 860]] },
    { ctrl: [[370, 40], [330, 210], [270, 390], [240, 520], [240, 860]] },
    { ctrl: [[250, 0], [290, 170], [340, 360], [380, 600], [410, 860]], rough: 1.5, seed: 45 },
  ],
  decorate(L, add) {
    // clouds in the upper sky, pale far ones and inked near ones
    put(add, 0, cloud(10, 70, 90, 3), "det", 1.1);
    put(add, 4, cloud(250, 120, 110, 5), "det", 1.1);
    put(add, 1, cloud(120, 30, 70, 8), "pale", 1.2);
    put(add, 3, cloud(300, 300, 80, 9), "pale", 1.2);
    put(add, 0, cloud(20, 250, 70, 12), "pale", 1.2);
    // planes riding the contrails
    for (const [k, s, dx] of [[1, 0.12, 0], [3, 0.1, 0], [0, 0.06, 0], [4, 0.05, 0]]) {
      const q = P(L[k], s), r = P(L[k], s + 0.02), a = Math.atan2(r[0] - q[0], -(r[1] - q[1])) + Math.PI;
      put(add, k, plane(q[0] + dx, q[1], k === 1 || k === 3 ? 16 : 11, -a), "det", 1.2);
    }
    // a soft second trail beside each contrail
    for (const k of [0, 1, 3, 4]) for (let s = 0.05; s < 0.45; s += 0.1) { const a = P(L[k], s), b = P(L[k], s + 0.07); add(k, [[a[0] + 5, a[1]], [b[0] + 5, b[1]]], "pale", 0.8); }
    // a green airliner at the top of the green line, coming in to land along it
    { const q = L[2][0], x = q[0], y = q[1] - 26, k = 1.9; // nose pointing down the runway
      const P2 = pts => pts.map(([u, v]) => [x + u * k, y + v * k]);
      add(2, P2([[0, 14], [-1.6, 10], [-2, -9], [0, -14], [2, -9], [1.6, 10], [0, 14]]), "acc", 2);     // fuselage
      add(2, P2([[-2, 1], [-15, -4], [-15, -6], [-2, -3]]), "acc", 1.8); add(2, P2([[2, 1], [15, -4], [15, -6], [2, -3]]), "acc", 1.8); // wings
      add(2, P2([[-1.5, -10], [-6, -13], [-6, -14.5], [0, -13]]), "acc", 1.5); add(2, P2([[1.5, -10], [6, -13], [6, -14.5], [0, -13]]), "acc", 1.5); // tailplane
      add(2, P2([[-8, -3], [-8, 0]]), "acc", 1.6); add(2, P2([[8, -3], [8, 0]]), "acc", 1.6); } // engines
    // runway: threshold bars, centre dashes, touchdown marks, edge lights, asphalt
    const top = P(L[2], 0.12)[1];
    for (let x = 166; x <= 234; x += 8) if (Math.abs(x - 200) > 4) add(2, [[x, top + 8], [x, top + 30]], "det", 1.4);
    for (let y = top + 50; y < 840; y += 30) { add(2, [[189, y], [189, y + 12]], "det", 1); add(2, [[211, y], [211, y + 12]], "det", 1); }
    for (const y of [top + 70, top + 110]) { put(add, 1, [rect(170, y, 8, 22)], "det", 1); put(add, 3, [rect(222, y, 8, 22)], "det", 1); }
    for (let y = 540; y < 860; y += 24) { add(1, blob(152, y, 1.6, 1.6, y, 6), "det", 1); add(3, blob(248, y, 1.6, 1.6, y + 1, 6), "det", 1); }
    texture(add, L[1], L[3], 0.62, 1, [1, 3], 41, 30, 0.35);
    // taxiway to the apron, a control tower and the terminal
    add(3, catmull([[240, 640], [270, 650], [300, 690], [312, 740]]), "det", 1.2);
    add(3, catmull([[240, 668], [262, 676], [286, 704], [296, 744]]), "det", 1.2);
    put(add, 4, [rect(290, 744, 100, 40), [[290, 756], [390, 756]], rect(300, 766, 12, 18), rect(330, 766, 12, 18), rect(360, 766, 12, 18)], "det", 1.1);
    put(add, 4, [[[348, 744], [350, 620]], [[358, 744], [356, 620]], [[336, 620], [370, 620], [366, 600], [340, 600], [336, 620]], [[353, 600], [353, 584]], [[340, 612], [366, 612]]], "det", 1.2);
    put(add, 4, plane(330, 806, 16, Math.PI / 2), "det", 1.2);
    // windsock, grass and distant hills
    add(1, [[110, 600], [110, 560]], "det", 1); add(1, [[110, 560], [128, 566], [126, 574], [110, 572]], "det", 1);
    for (let y = 540; y < 860; y += 34) { add(0, [[60 + (y % 3) * 20, y], [62 + (y % 3) * 20, y - 8]], "tex", 1); add(4, [[262 + (y % 4) * 6, y], [264 + (y % 4) * 6, y - 7]], "tex", 1); }
    add(0, catmull([[0, 470], [40, 452], [80, 462], [110, 448]]), "pale", 1.4);
    add(4, catmull([[290, 455], [330, 440], [370, 452], [410, 438]]), "pale", 1.4);
    add(4, vbird(330, 60)); add(4, vbird(350, 48, 5));
    add(0, arc(70, 380, 14, 0, Math.PI * 2, 18), "pale", 1.2);
  },
  // wide screens: more sky, more traffic, and the airport carrying on
  wings(L, add) {
    put(add, 0, cloud(-600, 120, 200, 21), "pale", 1.3);
    put(add, 0, cloud(-320, 300, 150, 22), "pale", 1.3);
    put(add, 4, cloud(480, 200, 220, 23), "det", 1.1);
    put(add, 4, cloud(620, 420, 160, 24), "pale", 1.3);
    add(0, [[-700, 60], [-160, 520]], "pale", 1); add(0, [[-660, 50], [-120, 510]], "pale", 0.8);
    put(add, 0, plane(-660, 52, 14, -0.86), "det", 1.1);
    add(4, [[900, 40], [460, 600]], "pale", 1); put(add, 4, plane(890, 52, 14, 0.67), "det", 1.1);
    for (const x of [440, 560, 680]) put(add, 4, [rect(x, 760, 100, 50), [[x, 776], [x + 100, 776]], [[x + 30, 810], [x + 30, 786], [x + 70, 786], [x + 70, 810]]], "det", 1);
    put(add, 4, plane(620, 840, 18, Math.PI / 2), "det", 1.1);
    add(0, [[-1100, 820], [0, 820]], "tex", 1); add(4, [[400, 820], [1400, 820]], "tex", 1);
    add(4, vbird(760, 120)); add(4, vbird(790, 106, 5));
  },
  bullet: (x, y) => plane(x, y, 20, -Math.PI / 4),
};
