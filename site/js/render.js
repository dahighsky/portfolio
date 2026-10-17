import { brush } from "./brush.js";

const MAIN_WIDTHS = [3.2, 3, 3.6, 2.6, 2.6];
const TONES = ["pale", "tex", "det", "acc"]; // acc: detail in line 2's colour

// Draws frames into the stage svg. Frames at rest (local === 0) are cached per
// scene, so sitting on a scene never re-tessellates its strokes.
export class Stage {
  constructor(svg) {
    this.mains = [0, 1, 2, 3, 4].map(i => svg.querySelector(`#m${i}`));
    this.tones = Object.fromEntries(TONES.map(t => [t, svg.querySelector(`#${t}`)]));
    this.cache = new Map();
  }

  paths(frame) {
    const out = { mains: frame.mains.map((L, i) => brush(L, MAIN_WIDTHS[i], i * 13 + 1)), pale: "", tex: "", det: "", acc: "" };
    for (const s of frame.strokes) out[s.tone] += brush(s.pts, s.wid, s.seed);
    return out;
  }

  draw(frame) {
    let d = frame.local === 0 ? this.cache.get(frame.k) : null;
    if (!d) {
      d = this.paths(frame);
      if (frame.local === 0) this.cache.set(frame.k, d);
    }
    d.mains.forEach((v, i) => { this.mains[i].setAttribute("d", v); this.mains[i].style.fill = frame.colors[i]; });
    for (const t of TONES) this.tones[t].setAttribute("d", d[t]);
    this.tones.acc.style.fill = frame.colors[2];
  }
}
