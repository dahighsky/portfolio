import { loadFont, wrap, strokes } from "./handwriting.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};
const d = pts => "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");

// The words as part of the drawing (wide screens): each block's title is written
// in brush strokes in the empty left of the canvas, and its bullets become labels
// in the right margin, each tied by a leader line to something in the scene.
export class Words {
  constructor(svg, fontUrl) {
    this.g = el("g", { id: "words", "aria-hidden": "true" }, svg);
    this.font = loadFont(fontUrl);
    this.key = null;
  }

  hide() {
    if (this.key === null) return;
    this.key = null;
    this.g.classList.remove("on");
  }

  // block: { eyebrow, title, lede, items: [{ html }] }; anchors: [x, y][] in scene units;
  // vb: { x, w } of the current viewBox; instant: skip the writing animation.
  async show(key, block, anchors, vb, instant) {
    if (this.key === key) return;
    this.key = key;
    const font = await this.font;
    if (this.key !== key) return;
    this.g.replaceChildren();
    this.g.classList.add("on");

    // title: wrapped to the left margin, written stroke by stroke
    const left = vb.x + vb.w * 0.06, width = Math.min(-left - 40, vb.w * 0.34), size = 78, lh = size * 0.86;
    const lines = wrap(font, block.title, size, width);
    let y = 330 - (lines.length - 1) * lh / 2;
    if (block.eyebrow) el("text", { x: left, y: y - size * 0.75, class: "eyebrow-w" }, this.g).textContent = block.eyebrow;
    const paths = [];
    for (const line of lines) {
      for (const s of strokes(font, line, left, y, size)) if (s.length > 1) paths.push(el("path", { d: d(s), class: "hand" }, this.g));
      y += lh;
    }
    const total = paths.reduce((t, p) => t + p.getTotalLength(), 0), speed = Math.max(total / 1600, 0.6); // ≤ 1.6s per title
    let at = 0;
    for (const p of paths) {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      // opacity too: a round cap would otherwise show a dot before the stroke starts
      if (!instant) p.animate([{ strokeDashoffset: len, opacity: 0 }, { strokeDashoffset: len, opacity: 1, offset: 0.001 }, { strokeDashoffset: 0, opacity: 1 }], { duration: len / speed, delay: at / speed, fill: "both", easing: "linear" });
      at += len;
    }
    const written = instant ? 0 : at / speed;
    if (block.lede) { // a typeset line under the title
      const fo = el("foreignObject", { x: left, y: y - lh + size * 0.42, width, height: 160, class: "label" }, this.g);
      const div = document.createElement("div");
      div.className = "lede-text"; div.innerHTML = block.lede; fo.append(div);
      fo.style.animationDelay = written + "ms";
    }

    // bullets: a column in the right margin, ordered to match their anchors, with leaders
    const colX = 432, colW = Math.min(320, vb.x + vb.w - colX - 32), items = block.items.slice(0, anchors.length || block.items.length);
    if (colW < 120) return;
    const order = items.map((it, i) => ({ it, a: anchors[i] })).sort((p, q) => (p.a?.[1] ?? 0) - (q.a?.[1] ?? 0));
    // each label's height from its length (≈ 7.6 units per character at 15px), so long ones don't collide
    const hOf = it => 24 + 21 * Math.ceil(it.html.replace(/<[^>]+>/g, "").length * 7.6 / colW), ys = [];
    order.forEach(({ a, it }, i) => ys.push(Math.max(a ? a[1] - 18 : 300 + i * 70, i ? ys[i - 1] + hOf(order[i - 1].it) + 14 : 90)));
    const over = ys.length ? ys[ys.length - 1] + hOf(order[order.length - 1].it) - 830 : 0;
    if (over > 0) for (let i = 0; i < ys.length; i++) ys[i] -= over;
    order.forEach(({ it, a }, i) => {
      const g = el("g", { class: "label" }, this.g), ly = ys[i];
      if (a) {
        el("circle", { cx: a[0], cy: a[1], r: 3.5, class: "pin" }, g);
        el("path", { d: d([a, [colX - 46, ly + 16], [colX - 8, ly + 16]]), class: "leader" }, g);
      }
      const fo = el("foreignObject", { x: colX, y: ly, width: colW, height: hOf(it) + 10 }, g);
      const div = document.createElement("div");
      div.className = "label-text";
      div.innerHTML = it.html;
      fo.append(div);
      g.style.animationDelay = (written + i * 140) + "ms";
    });
  }
}
