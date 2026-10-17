import { N, rng, makeLine } from "./geom.js";

const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 2147483647; return h; };

// Builds a scene definition into geometry: five lines of N points, plus detail
// strokes stored as (nearest parent point index, offset) pairs, so a detail can
// melt onto its line (offset → 0) and grow back out of it.
export function buildScene(def) {
  if (def.lines.length !== 5) throw new Error(`scene ${def.id}: expected 5 lines, got ${def.lines.length}`);
  const lines = def.lines.map(makeLine), det = [], r = rng(hash(def.id));
  const add = (parent, pts, tone = "det", wid = 1.3) => {
    if (!(parent >= 0 && parent <= 4 && Number.isInteger(parent))) throw new Error(`scene ${def.id}: bad parent ${parent}`);
    const L = lines[parent];
    det.push({
      tone, wid, seed: r() * 99, delay: r() * 0.45, parent,
      pts: pts.map(q => {
        if (!Array.isArray(q) || q.length !== 2 || !Number.isFinite(q[0]) || !Number.isFinite(q[1]))
          throw new Error(`scene ${def.id}: detail points must be finite [x, y] pairs, got ${JSON.stringify(q)}`);
        let bi = 0, bd = Infinity;
        for (let i = 0; i < N; i++) {
          const d = (L[i][0] - q[0]) ** 2 + (L[i][1] - q[1]) ** 2;
          if (d < bd) { bd = d; bi = i; }
        }
        return [bi, q[0] - L[bi][0], q[1] - L[bi][1]];
      }),
    });
  };
  def.decorate(lines, add);
  return { id: def.id, title: def.title, lines, det };
}
