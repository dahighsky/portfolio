import { loadFont, wrap, strokes } from "./handwriting.js";
import { brush } from "./brush.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent?.append(e);
  return e;
};
const d = pts => "M" + pts.map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L");

// The words as part of the drawing (wide screens): each block's title is written
// in brush strokes in the empty left of the canvas, with its bullets listed under
// it, each marked with the scene's own small ink bullet (a pine, a surfboard, …).
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

  // block: { eyebrow, title, lede, items: [{ html }] }; bullet: (x, y) => polylines, the
  // scene's bullet mark; vb: { x, w } of the current viewBox; instant: skip the writing.
  async show(key, block, bullet, vb, instant) {
    if (this.key === key) return;
    this.key = key;
    const font = await this.font;
    if (this.key !== key) return;
    this.g.replaceChildren();
    this.g.classList.add("on");

    // one column in the empty left of the canvas: eyebrow, title, subtitle, bullets
    const left = vb.x + vb.w * 0.06, width = Math.min(-left - 40, vb.w * 0.34), size = 72, lh = size * 0.86;
    const lines = wrap(font, block.title, size, width);
    const textH = (html, px, w) => Math.ceil(html.replace(/<[^>]+>/g, "").length * px * 0.5 / w) * px * 1.45;
    const ledeH = block.lede ? textH(block.lede, 19, width) + 18 : 0;
    const itemW = width - 34, itemHs = block.items.map(it => textH(it.html, 17, itemW) + 12);
    const total = (block.eyebrow ? 26 : 0) + lines.length * lh + ledeH + (itemHs.length ? 22 : 0) + itemHs.reduce((a, b) => a + b, 0);
    let y = Math.max(70, 430 - total / 2) + (block.eyebrow ? 26 : 0) + size * 0.7;
    if (block.eyebrow) el("text", { x: left, y: y - size * 0.82, class: "eyebrow-w" }, this.g).textContent = block.eyebrow;

    // title, written stroke by stroke as a pen line, each stroke then inked with the brush taper
    const paths = [];
    for (const line of lines) {
      for (const s of strokes(font, line, left, y, size)) if (s.length > 1) { const p = el("path", { d: d(s), class: "hand" }, this.g); p.pts = s; paths.push(p); }
      y += lh;
    }
    const ink = (p, i) => p.replaceWith(el("path", { d: brush(p.pts, 4.4, i), class: "inked" }));
    const totalLen = paths.reduce((t, p) => t + p.getTotalLength(), 0), speed = Math.max(totalLen / 1600, 0.6); // ≤ 1.6s
    let at = 0;
    for (const p of paths) {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      // opacity too: a round cap would otherwise show a dot before the stroke starts
      if (instant) ink(p, at);
      else {
        const i = at, a = p.animate([{ strokeDashoffset: len, opacity: 0 }, { strokeDashoffset: len, opacity: 1, offset: 0.001 }, { strokeDashoffset: 0, opacity: 1 }], { duration: len / speed, delay: at / speed, fill: "both", easing: "linear" });
        a.onfinish = () => p.isConnected && ink(p, i);
      }
      at += len;
    }
    const written = instant ? 0 : at / speed;
    y += size * 0.1 - lh;

    const fo = (x, top, w, h, cls, html, delay) => {
      const g = el("g", { class: "label" }, this.g), f = el("foreignObject", { x, y: top, width: w, height: h + 8 }, g);
      const div = document.createElement("div"); div.className = cls; div.innerHTML = html; f.append(div);
      g.style.animationDelay = delay + "ms";
      return g;
    };
    if (block.lede) { fo(left, y + 8, width, ledeH, "lede-text", block.lede, written); y += ledeH; }
    y += itemHs.length ? 22 : 0;
    block.items.forEach((it, i) => {
      const g = fo(left + 34, y, itemW, itemHs[i], "label-text", it.html, written + 120 + i * 140);
      if (bullet) for (const [k, poly] of bullet(left + 12, y + 13).entries()) el("path", { d: brush(poly, 1.7, k + i), class: "inked" }, g);
      y += itemHs[i];
    });
  }
}
