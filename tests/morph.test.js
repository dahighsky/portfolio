import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScene } from "../site/js/scene.js";
import { frameAt } from "../site/js/morph.js";

const straight = x => ({ ctrl: [[x, 0], [x, 860]], smooth: false });
const A = buildScene({
  id: "a", title: "A", lines: [40, 120, 200, 280, 360].map(straight),
  decorate(L, add) { for (let k = 0; k < 12; k++) add(k % 5, [[30 + k * 30, 100 + k * 50], [50 + k * 30, 120 + k * 50]]); },
});
const B = buildScene({
  id: "b", title: "B", lines: [80, 140, 220, 300, 380].map(straight),
  decorate(L, add) { for (let k = 0; k < 12; k++) add(k % 5, [[60 + k * 25, 700 - k * 40], [64 + k * 25, 690 - k * 40]], "pale"); },
});
const S = [A, B];

const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

test("at integer p the frame equals that scene", () => {
  for (const [p, sc] of [[0, A], [1, B]]) {
    const f = frameAt(S, p);
    assert.deepEqual(f.mains, sc.lines);
    assert.equal(f.strokes.length, sc.det.length);
    f.strokes.forEach((st, n) => {
      const d = sc.det[n], L = sc.lines[d.parent];
      assert.equal(st.wid, d.wid);
      assert.equal(st.tone, d.tone);
      d.pts.forEach(([i, dx, dy], k) => assert.ok(near(st.pts[k][0], L[i][0] + dx) && near(st.pts[k][1], L[i][1] + dy)));
    });
  }
});

test("by p = k + 0.32 old detail has fully melted onto its line", () => {
  // just before the end of melt, what remains sits on the lines as drawn in that frame
  const f = frameAt(S, 0.31);
  assert.ok(f.strokes.length > 0);
  for (const st of f.strokes) for (const q of st.pts)
    assert.ok(f.mains.some(L => L.some(r => Math.hypot(r[0] - q[0], r[1] - q[1]) < 1)), `${q}`);
  assert.equal(frameAt(S, 0.32).strokes.length, 0);
});

test("between 0.32 and 0.68 no detail is drawn", () => {
  for (const p of [0.32, 0.4, 0.5, 0.6, 0.68]) assert.equal(frameAt(S, p).strokes.length, 0, `p=${p}`);
});

test("lines stagger", () => {
  const f = frameAt(S, 0.5);
  const moved = i => (f.mains[i][100][0] - A.lines[i][100][0]) / (B.lines[i][100][0] - A.lines[i][100][0]);
  assert.ok(moved(0) > moved(4), `${moved(0)} vs ${moved(4)}`);
  assert.ok(moved(4) > 0);
});

test("stateless", () => {
  const cold = frameAt(S, 0.8);
  frameAt(S, 0.2);
  assert.deepEqual(frameAt(S, 0.8), cold);
});

test("clamps p", () => {
  assert.deepEqual(frameAt(S, -3), frameAt(S, 0));
  assert.deepEqual(frameAt(S, 99), frameAt(S, 1));
  assert.deepEqual(frameAt(S, NaN), frameAt(S, 0));
  const f = frameAt(S, 1);
  assert.equal(f.k, 1); assert.equal(f.local, 0);
});
