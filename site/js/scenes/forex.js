import { catmull } from "../geom.js";
import { rng } from "../geom.js";
import { glyph, flap, digit, coin, ellipse, put, arc, traveller, rect } from "../shapes.js";

// An airport currency-exchange board. The five lines are its column dividers;
// rows carry a currency glyph, split-flap buy and sell rates, and a trend tick.
const XS = [44, 118, 200, 282, 356];
const col = (x, k) => ({ ctrl: [[x, 0], [x + (k % 2 ? 1.5 : -1.5), 300], [x, 600], [x + (k % 2 ? -1 : 1), 860]] });
const CUR = ["₹", "$", "€", "£", "¥", "$", "€", "₹", "£", "¥"];
const TOP = 150, ROW = 42, ROWS = 10;

export default {
  id: "forex",
  title: "Forex",
  lines: XS.map(col),
  decorate(L, add) {
    const R = rng(99);
    // board frame and header
    add(2, [[16, TOP - 50], [384, TOP - 50]], "det", 1.6);
    add(2, [[16, TOP - 6], [384, TOP - 6]], "det", 1.2);
    add(2, [[16, TOP + ROW * ROWS + 6], [384, TOP + ROW * ROWS + 6]], "det", 1.6);
    for (const [x, n] of [[128, 3], [210, 4]]) for (let i = 0; i < n; i++) put(add, x < 200 ? 1 : 2, flap(x + i * 11, TOP - 36, 9, 13), "det", 0.9);
    for (let i = 0; i < 4; i++) put(add, 3, flap(292 + i * 11, TOP - 36, 9, 13), "det", 0.9);
    // rows
    for (let r = 0; r < ROWS; r++) {
      const y = TOP + r * ROW;
      add(r % 2 ? 0 : 4, [[16, y + ROW], [384, y + ROW]], "tex", 0.9);
      put(add, 0, glyph(CUR[r], 72, y + 13, 1.3), "det", 1.3);
      const rate = (90 * R() + 1).toFixed(2).padStart(5, "0"), sell = (+rate * 1.02).toFixed(2).padStart(5, "0").slice(0, 5);
      for (const [x0, parent, txt] of [[126, 1, rate], [208, 3, sell]]) for (let i = 0; i < 5; i++) {
        put(add, parent, flap(x0 + i * 13, y + 13, 10, 15), "tex", 0.9);
        put(add, parent, digit(txt[i], x0 + i * 13 + 2, y + 15.5, 6, 10), "det", 1);
      }
      const up = (r * 7) % 3 !== 0;
      add(4, up ? [[300, y + 28], [310, y + 18], [318, y + 26], [334, y + 12]] : [[300, y + 14], [310, y + 24], [318, y + 18], [334, y + 30]], "det", 1.2);
      add(4, up ? [[328, y + 12], [334, y + 12], [334, y + 18]] : [[328, y + 30], [334, y + 30], [334, y + 24]], "det", 1);
    }
    // ceiling lights and a hanging clock above the board
    for (const x of [60, 160, 260, 360]) { add(x < 200 ? 0 : 4, [[x, 0], [x, 30]], "pale", 0.9); add(x < 200 ? 0 : 4, arc(x, 38, 10, Math.PI, Math.PI * 2, 10), "pale", 1.2); }
    add(2, [[200, 0], [200, 28]], "det", 0.9); put(add, 2, [ellipse(200, 48, 18, 18), [[200, 48], [200, 36]], [[200, 48], [209, 52]]], "det", 1.1);
    // faint glyphs floating on the wall
    put(add, 0, glyph("€", 20, 30, 1.6), "pale", 1.2); put(add, 4, glyph("¥", 362, 70, 1.5), "pale", 1.2); put(add, 1, glyph("£", 140, 66, 1.4), "pale", 1.2);
    // counter ledge, coins and fanned notes
    const C = 744;
    add(2, [[0, C], [400, C]], "det", 2); add(2, [[0, C + 10], [400, C + 10]], "det", 1);
    for (const [x, n] of [[90, 5], [118, 3], [300, 4]]) for (let i = 0; i < n; i++) put(add, x < 200 ? 1 : 3, coin(x, C - 6 - i * 5, 11), "det", 1);
    for (let i = 0; i < 4; i++) { // fanned notes
      const a = -0.35 + i * 0.18, cx = 230, cy = C - 4, c = Math.cos(a), sn = Math.sin(a);
      const R2 = ([u, v]) => [cx + u * c - v * sn, cy + u * sn + v * c];
      add(i < 2 ? 2 : 3, [[-30, 0], [30, 0], [30, -30], [-30, -30], [-30, 0]].map(R2), "det", 0.9);
      add(i < 2 ? 2 : 3, [[-20, -15], [20, -15]].map(R2), "tex", 0.8);
    }
    // the queue: a rope barrier
    for (const x of [30, 150, 270, 390]) put(add, x < 200 ? 0 : 4, [[[x, 880], [x, 812]], ellipse(x, 810, 4, 3)], "det", 1.2);
    add(0, catmull([[30, 814], [90, 838], [150, 814]]), "det", 1.1); add(4, catmull([[270, 814], [330, 838], [390, 814]]), "det", 1.1);
  },
  // wide screens: the hall around the board: the queue, more counters, more rates
  wings(L, add) {
    add(2, [[-1100, 744], [0, 744]], "det", 2); add(2, [[400, 744], [1400, 744]], "det", 2);
    for (const x of [-520, -420, -330]) put(add, 0, traveller(x, 860, 1.6), "det", 1.2);
    put(add, 0, [rect(-200, 820, 44, 40), [[-190, 820], [-190, 810], [-166, 810], [-166, 820]]], "det", 1.1);
    for (let r = 0; r < 6; r++) { const y = 200 + r * 60; add(4, [[460, y], [760, y]], "tex", 0.9); put(add, 4, glyph(["$", "€", "£", "¥", "₹", "$"][r], 480, y + 12, 1.6), "pale", 1.2); add(4, [[560, y + 30], [700, y + 30]], "pale", 1.2); }
    put(add, 4, [rect(440, 160, 340, 380)], "pale", 1.3);
    for (const x of [500, 620, 740]) put(add, 4, [rect(x, 640, 90, 104), [[x, 676], [x + 90, 676]]], "det", 1);
    for (let i = 0; i < 4; i++) put(add, 4, coin(560, 736 - i * 5, 11), "det", 1);
    put(add, 0, glyph("€", -400, 200, 3), "pale", 1.4); put(add, 0, glyph("₹", -200, 380, 2.6), "pale", 1.4);
  },
  bullet: (x, y) => [ellipse(x, y, 9, 9), ellipse(x, y, 6, 6), ...glyph("₹", x - 3, y - 4, 0.6)],
};
