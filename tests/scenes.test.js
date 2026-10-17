import { test } from "node:test";
import assert from "node:assert/strict";
import { N, P } from "../site/js/geom.js";
import { buildScene } from "../site/js/scene.js";
import { frameAt } from "../site/js/morph.js";
import { brush } from "../site/js/brush.js";
import { SCENES } from "../site/js/scenes/index.js";

const built = SCENES.map(buildScene);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const xRange = (L, s0, s1) => { const xs = L.slice(Math.round(s0 * (N - 1)), Math.round(s1 * (N - 1)) + 1).map(q => q[0]); return Math.max(...xs) - Math.min(...xs); };

// What each scene's five lines must do for the imagery to read (see the spec).
const INVARIANTS = {
  mountains(L) { assert.ok(dist(L[0][0], L[1][0]) <= 1, "L0 and L1 share the peak"); },
  coast(L) { for (const l of L) assert.ok(l[0][1] <= 0 && l[N - 1][1] >= 860, "bay runs off both edges"); },
};

test("scene ids are unique and every scene has invariants", () => {
  const ids = SCENES.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(INVARIANTS[id], `no invariants for ${id}`);
});

for (const s of built) {
  test(`${s.id}: five top-to-bottom lines of N finite points`, () => {
    assert.equal(s.lines.length, 5);
    for (const L of s.lines) {
      assert.equal(L.length, N);
      L.forEach((q, i) => {
        assert.ok(Number.isFinite(q[0]) && Number.isFinite(q[1]));
        if (i) assert.ok(q[1] >= L[i - 1][1] - 40, `y goes back up at ${i}`);
      });
    }
    for (const d of s.det) assert.ok(d.parent >= 0 && d.parent <= 4);
  });
  test(`${s.id}: invariants`, () => INVARIANTS[s.id]?.(s.lines, s));
}

test("no NaN anywhere along the scroll", () => {
  for (let p = 0; p <= built.length - 1 + 1e-9; p += 0.05) {
    const f = frameAt(built, p);
    for (const L of f.mains) assert.ok(!brush(L, 3).includes("NaN"), `main at p=${p}`);
    for (const st of f.strokes) assert.ok(!brush(st.pts, st.wid, st.seed).includes("NaN"), `detail at p=${p}`);
  }
});

