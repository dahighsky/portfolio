import { rng } from "../geom.js";
import { rect, rrect, digit, goldBar, ellipse, put, tick } from "../shapes.js";

// Web and app: lines 0–1 outline a phone, lines 3–4 a desktop trading terminal
// on its stand, and the accent line runs between them as a vertical price tape.
function candles(add, parent, x0, x1, yTop, yBot, n, seed, wid = 1) {
  const r = rng(seed), w = (x1 - x0) / n;
  let price = yBot - (yBot - yTop) * 0.25;
  for (let i = 0; i < n; i++) {
    const open = price; price -= (r() - 0.32) * (yBot - yTop) * 0.16; price = Math.max(yTop + 12, Math.min(yBot - 12, price));
    const hi = Math.min(open, price) - 4 - r() * 8, lo = Math.max(open, price) + 4 + r() * 8, x = x0 + (i + 0.5) * w;
    add(parent, [[x, hi], [x, lo]], "det", wid);
    put(add, parent, [rect(x - w * 0.28, Math.min(open, price), w * 0.56, Math.max(2, Math.abs(price - open)))], price < open ? "det" : "tex", wid);
  }
}

const PHONE = { top: 150, bot: 402 }; // about 116 × 252: a phone's proportions

// One side of the phone, from the top centre round the corners to the bottom centre.
const phoneEdge = side => {
  const cx = 90, hw = 58, r = 14, top = PHONE.top, bot = PHONE.bot, x = a => cx + side * a;
  const corner = (cy, a0, a1) => Array.from({ length: 5 }, (_, i) => { const a = a0 + (a1 - a0) * i / 4; return [x(hw - r + r * Math.cos(a)), cy + r * Math.sin(a)]; });
  return [[cx, top], ...corner(top + r, -Math.PI / 2, 0), ...corner(bot - r, 0, Math.PI / 2), [cx, bot]];
};

export default {
  id: "groww-terminal",
  title: "Trading terminal",
  colors: { 0: "#00d09c", 1: "#00d09c", 3: "#5367ff", 4: "#5367ff" }, // the phone in Groww green, the terminal in Groww blue
  lines: [
    { ctrl: phoneEdge(-1), smooth: false },
    { ctrl: phoneEdge(1), smooth: false },
    { ctrl: Array.from({ length: 22 }, (_, i) => [180 + (i % 2 ? 6 : -6) * (1 + (i * 7 % 5) / 4), i * 41]) },
    { ctrl: [[300, 110], [214, 112], [210, 126], [210, 420], [214, 432], [290, 436], [294, 500], [250, 516], [246, 524]], smooth: false },
    { ctrl: [[300, 110], [386, 112], [390, 126], [390, 420], [386, 432], [310, 436], [306, 500], [350, 516], [354, 524]], smooth: false },
  ],
  decorate(L, add) {
    // phone: speaker, header with a gold ticker and price, chart, buy/sell, home bar
    const t = PHONE.top, b = PHONE.bot;
    add(0, [[78, t + 12], [102, t + 12]], "det", 1.4);
    put(add, 0, goldBar(44, t + 30, 20, 7), "det", 1);
    add(0, [[70, t + 30], [110, t + 30]], "tex", 1); add(1, [[70, t + 39], [98, t + 39]], "tex", 1);
    [..."71240"].forEach((d, i) => put(add, i < 3 ? 0 : 1, digit(d, 44 + i * 12, t + 50, 8, 14), "det", 1.3));
    add(1, tick(126, t + 58, 8), "det", 1);
    candles(add, 0, 40, 140, t + 76, t + 170, 9, 7);
    for (let i = 0; i < 9; i++) add(i < 5 ? 0 : 1, [[45 + i * 11, t + 192], [45 + i * 11, t + 188 - (i * 13) % 10]], "tex", 1.2);
    put(add, 0, [rrect(40, b - 50, 48, 22, 6)], "det", 1.1); put(add, 1, [rrect(92, b - 50, 48, 22, 6)], "det", 1.1);
    add(0, [[54, b - 39], [74, b - 39]], "det", 1.4); add(1, [[106, b - 39], [126, b - 39]], "det", 1.4);
    add(0, [[72, b - 12], [108, b - 12]], "det", 1.2);
    // terminal: tabs, candle chart with an average, order book, positions
    for (let i = 0; i < 3; i++) put(add, 3, [rrect(218 + i * 44, 134, 40, 14, 4)], i === 0 ? "det" : "tex", 1);
    put(add, 3, goldBar(222, 140, 10, 4), "det", 0.9);
    put(add, 3, [[[272, 136], [268, 143], [272, 146], [276, 143], [272, 136]]], "det", 0.9);
    candles(add, 3, 216, 320, 164, 336, 13, 11, 0.9);
    add(3, Array.from({ length: 14 }, (_, i) => [218 + i * 7.6, 300 - i * 6 - 12 * Math.sin(i / 2)]), "pale", 1.2);
    add(4, [[326, 160], [326, 340]], "tex", 0.8);
    for (let r = 0; r < 14; r++) {
      const y = 166 + r * 12.5, ask = r < 7, depth = 6 + ((r * 37) % 23);
      add(4, ask ? [[384 - depth, y], [384, y]] : [[332, y], [332 + depth, y]], "det", 1.4);
      add(4, [[342, y], [372, y]], "tex", 0.7);
    }
    add(4, [[326, 253], [390, 253]], "det", 1);
    add(3, [[212, 348], [388, 348]], "det", 1);
    for (let r = 0; r < 5; r++) { const y = 362 + r * 11; add(3, [[220, y], [262, y]], "tex", 0.8); add(4, [[300, y], [330, y]], "tex", 0.8); add(4, [[350, y], [380, y]], r % 2 ? "det" : "tex", 0.9); }
    // the tape: up and down marks beside the accent line
    for (let i = 1; i < 20; i++) { const q = L[2][Math.round(i / 20 * 239)], up = (i * 5) % 3 !== 0;
      add(2, up ? [[q[0] + 10, q[1] + 4], [q[0] + 14, q[1] - 2], [q[0] + 18, q[1] + 4]] : [[q[0] + 10, q[1] - 2], [q[0] + 14, q[1] + 4], [q[0] + 18, q[1] - 2]], up ? "det" : "tex", 1); }
    // desk below: keyboard, a mug, coins
    add(2, [[0, 760], [400, 760]], "det", 1.4);
    put(add, 3, [rrect(232, 776, 136, 26, 4)], "det", 1);
    for (let k = 0; k < 3; k++) add(3, [[240, 783 + k * 7], [360, 783 + k * 7]], "tex", 0.8);
    put(add, 0, [[[40, 780], [40, 820], [70, 820], [70, 780]], ellipse(55, 780, 15, 4), ellipse(76, 798, 7, 9, -Math.PI / 2, Math.PI / 2, 8)], "det", 1.1);
    for (let i = 0; i < 3; i++) put(add, 1, [ellipse(120, 812 - i * 5, 12, 5)], "det", 1);
  },
  // wide screens: the rest of the desk
  wings(L, add) {
    add(2, [[-1100, 760], [0, 760]], "det", 1.4); add(2, [[400, 760], [1400, 760]], "det", 1.4);
    put(add, 4, [rrect(440, 160, 300, 220, 10), [[580, 380], [580, 440]], [[530, 446], [630, 446]]], "pale", 1.4);
    for (let i = 0; i < 10; i++) add(4, [[460 + i * 28, 340 - (i * 23) % 120], [460 + i * 28, 360 - (i * 23) % 120 + 20]], "pale", 1.2);
    put(add, 0, [rect(-360, 700, 140, 60), [[-350, 714], [-240, 714]], [[-350, 728], [-260, 728]]], "det", 1);
    add(0, [[-140, 760], [-150, 690]], "det", 1.2);
    for (const [dx, dy] of [[-30, -40], [-10, -60], [16, -54], [30, -30]]) add(0, [[-146, 700], [-146 + dx, 700 + dy]], "det", 1.1);
    put(add, 0, [[[-176, 760], [-170, 720], [-122, 720], [-116, 760]]], "det", 1.1);
  },
  bullet: (x, y) => [[[x - 4, y - 12], [x - 4, y + 12]], rect(x - 8, y - 6, 8, 12), [[x + 6, y - 8], [x + 6, y + 10]], rect(x + 2, y - 2, 8, 8)], // candlesticks
};
