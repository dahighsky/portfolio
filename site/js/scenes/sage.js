import { rng } from "../geom.js";
import { rect, rrect, ellipse, arc, stamp, glyph, traveller, blob, put, plane } from "../shapes.js";

// Expenses and corporate cards: a receipt unrolls down the middle (lines 1 and 3
// are its sides, the accent line its perforated tear), cards fan out to the left,
// and an approval chain runs down line 4 to a reimbursed total.
const RX0 = 120, RX1 = 290, TEAR = 276;
const rot = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);

function card(add, cx, cy, a) {
  const R = p => rot(p, cx, cy, a);
  add(0, R(rrect(cx - 52, cy - 33, 104, 66, 7)), "det", 1.2);
  add(0, R(rrect(cx - 40, cy - 14, 16, 12, 2)), "det", 0.9);
  add(0, R([[cx - 40, cy - 8], [cx - 24, cy - 8]]), "tex", 0.7);
  for (let g = 0; g < 4; g++) add(0, R([[cx - 40 + g * 22, cy + 12], [cx - 26 + g * 22, cy + 12]]), "det", 1);
  add(0, R([[cx - 40, cy + 22], [cx - 10, cy + 22]]), "tex", 0.9);
  for (const r of [5, 9]) add(0, R(arc(cx + 34, cy - 18, r, -0.7, 0.7, 6)), "det", 0.9);
}

export default {
  id: "sage",
  title: "Expenses and cards",
  lines: [
    { ctrl: [[52, 0], [44, 200], [58, 420], [40, 640], [50, 860]] },
    { ctrl: [[RX0, 54], [RX0, 300], [RX0, 600], [RX0, 860]] },
    { ctrl: Array.from({ length: 70 }, (_, i) => [TEAR + (i % 2 ? 4 : -4), 54 + i * 806 / 69]), smooth: false },
    { ctrl: [[RX1, 54], [RX1, 300], [RX1, 600], [RX1, 860]] },
    { ctrl: [[352, 80], [350, 300], [354, 560], [348, 860]], rough: 1, seed: 81 },
  ],
  decorate(L, add) {
    const R = rng(81);
    // the roll the receipt comes off
    put(add, 2, [[[RX0 - 6, 44], [RX1 + 6, 44]], ellipse(RX0 - 6, 50, 5, 9), ellipse(RX1 + 6, 50, 5, 9), [[RX0 - 6, 56], [RX1 + 6, 56]]], "det", 1.2);
    // header, line items, total, barcode
    add(1, ellipse(200, 86, 9, 9), "det", 1.1);
    add(1, [[170, 106], [230, 106]], "tex", 1); add(1, [[182, 114], [218, 114]], "tex", 1);
    for (let y = 136; y < 430; y += 24) {
      add(1, [[132, y], [132 + 34 + R() * 50, y]], "det", 1);
      add(3, [[238 + R() * 10, y], [266, y]], "det", 1);
      if (R() < 0.4) add(1, [[132, y + 8], [132 + 20 + R() * 30, y + 8]], "tex", 0.8);
    }
    add(1, [[132, 446], [266, 446]], "det", 1); add(1, [[132, 450], [266, 450]], "det", 1);
    add(1, [[132, 466], [180, 466]], "det", 1.6); add(3, [[228, 466], [266, 466]], "det", 1.8);
    put(add, 3, glyph("₹", 212, 459, 1), "det", 1);
    for (let x = 140; x < 262; x += 3 + (x * 7 % 4)) add(x < 200 ? 1 : 3, [[x, 492], [x, 528]], "det", x % 3 ? 0.7 : 1.3);
    for (let y = 760; y < 860; y += 24) { add(1, [[132, y], [132 + 40 + R() * 50, y]], "det", 1); add(3, [[236, y], [266, y]], "det", 1); }
    // corporate cards, fanned to the left of the receipt
    card(add, 62, 208, -0.32); card(add, 66, 250, -0.12); card(add, 70, 292, 0.08);
    // the approval chain: approvers, stamps, ticks, down to the reimbursed total
    const chain = [140, 236, 332, 428];
    chain.forEach((y, i) => {
      put(add, 4, stamp(352, y, 14), "det", 1.1);
      add(4, ellipse(320, y - 6, 5, 5), "det", 1); add(4, arc(320, y + 10, 9, Math.PI, Math.PI * 2, 8), "det", 1);
      if (i < chain.length - 1) for (let d = 22; d < 80; d += 12) add(4, [[352, y + d], [352, y + d + 5]], "tex", 1.2);
    });
    add(4, [[318, 488], [388, 488]], "det", 1.2); add(4, [[318, 493], [388, 493]], "det", 1.2);
    put(add, 4, glyph("₹", 334, 504, 1.4), "det", 1.2); add(4, [[352, 512], [384, 512]], "det", 1.6);
    // and back to travel: someone heading off on the next trip
    put(add, 4, traveller(336, 846, 1.3), "det", 1.2);
    add(0, [[0, 852], [400, 852]], "tex", 1);
    // coins and a pen beside the cards
    for (let i = 0; i < 3; i++) add(0, ellipse(52, 400 - i * 5, 14, 6), "det", 1);
    add(0, [[22, 470], [96, 430]], "det", 1.8); add(0, [[96, 430], [102, 427]], "det", 1);
    add(0, blob(30, 820, 12, 6, 3), "det", 1);
  },
  // wide screens: more of the paperwork: older receipts, a laptop report, a ticket
  wings(L, add) {
    for (const [x, a] of [[-420, -0.08], [-260, 0.05]]) { const pts = rect(x, 120, 120, 300).map(([px, py]) => [x + (px - x) * Math.cos(a) - (py - 120) * Math.sin(a), 120 + (px - x) * Math.sin(a) + (py - 120) * Math.cos(a)]);
      add(0, pts, "pale", 1.2); for (let y = 150; y < 400; y += 24) add(0, [[x + 14, y + (x + 14 - x) * Math.sin(a)], [x + 90, y + 76 * Math.sin(a)]], "pale", 1); }
    put(add, 4, [rrect(440, 200, 300, 190, 8), [[420, 400], [760, 400]], [[420, 400], [440, 390]], [[760, 400], [740, 390]]], "det", 1.1);
    for (let r = 0; r < 6; r++) { add(4, [[464, 228 + r * 24], [600, 228 + r * 24]], "tex", 1); add(4, [[660, 228 + r * 24], [716, 228 + r * 24]], "det", 1); }
    put(add, 4, stamp(700, 520, 22), "det", 1.2);
    put(add, 4, [rrect(470, 620, 230, 90, 8), [[630, 620], [630, 710]]], "det", 1.1);
    put(add, 4, plane(560, 664, 22, -Math.PI / 2), "det", 1.1);
    add(4, [[640, 650], [690, 650]], "tex", 1); add(4, [[640, 676], [680, 676]], "tex", 1);
  },
};
