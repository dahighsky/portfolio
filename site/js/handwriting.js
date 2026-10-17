// Single-stroke handwriting from an SVG font (EMS Allure, SIL OFL). Each glyph
// is a set of centre-line strokes, so text can be "written" one stroke at a time.

export async function loadFont(url) {
  const doc = new DOMParser().parseFromString(await (await fetch(url)).text(), "image/svg+xml");
  const face = doc.querySelector("font-face"), font = doc.querySelector("font");
  const glyphs = new Map();
  for (const g of doc.querySelectorAll("glyph")) {
    const ch = g.getAttribute("unicode");
    if (ch == null) continue;
    glyphs.set(ch, { adv: +(g.getAttribute("horiz-adv-x") ?? font.getAttribute("horiz-adv-x")), strokes: parsePath(g.getAttribute("d") || "") });
  }
  return { glyphs, em: +face.getAttribute("units-per-em"), adv: +font.getAttribute("horiz-adv-x") };
}

// M/L/C path data → polylines (curves sampled).
function parsePath(d) {
  const tok = d.match(/[MLC]|-?[\d.]+(?:e-?\d+)?/gi) || [], out = [];
  let i = 0, cmd = "", cur = null, pen = [0, 0];
  const num = () => +tok[i++];
  while (i < tok.length) {
    if (/[MLC]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === "M") { pen = [num(), num()]; cur = [pen]; out.push(cur); cmd = "L"; }
    else if (cmd === "L") { pen = [num(), num()]; cur.push(pen); }
    else if (cmd === "C") {
      const p0 = pen, p1 = [num(), num()], p2 = [num(), num()], p3 = [num(), num()];
      for (let s = 1; s <= 8; s++) { const t = s / 8, u = 1 - t;
        cur.push([0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k])); }
      pen = p3;
    } else i++;
  }
  return out;
}

const advance = (font, ch) => (font.glyphs.get(ch)?.adv ?? font.adv);
export const measure = (font, text, size) => [...text].reduce((w, ch) => w + advance(font, ch), 0) * size / font.em;

// Greedy word wrap to maxWidth (in output units).
export function wrap(font, text, size, maxWidth) {
  const lines = [];
  for (const word of text.split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (last && measure(font, last + " " + word, size) <= maxWidth) lines[lines.length - 1] = last + " " + word;
    else lines.push(word);
  }
  return lines;
}

// Strokes for a line of text with its baseline starting at (x, y); y grows downward.
export function strokes(font, text, x, y, size) {
  const k = size / font.em, out = [];
  let pen = x;
  for (const ch of text) {
    const g = font.glyphs.get(ch);
    if (g) for (const s of g.strokes) out.push(s.map(([gx, gy]) => [pen + gx * k, y - gy * k]));
    pen += advance(font, ch) * k;
  }
  return out;
}
