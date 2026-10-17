import { test } from "node:test";
import assert from "node:assert/strict";
import { N, resample, makeLine, noise, P } from "../site/js/geom.js";

const finite = pts => pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

test("resample returns n points with equal spacing", () => {
  const r = resample([[0, 0], [0, 100], [100, 100]], 21);
  assert.equal(r.length, 21);
  assert.deepEqual(r[0], [0, 0]);
  assert.ok(Math.abs(r[20][0] - 100) < 1e-9 && Math.abs(r[20][1] - 100) < 1e-9);
  for (let i = 1; i < r.length; i++) {
    const gap = Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]);
    assert.ok(Math.abs(gap - 10) < 1e-6, `gap ${i} = ${gap}`);
  }
});

test("resample tolerates duplicate points", () => {
  const r = resample([[0, 0], [0, 0], [0, 50]], 6);
  assert.ok(finite(r));
  assert.deepEqual(r[5], [0, 50]);
});

test("makeLine yields N finite points from first to last ctrl", () => {
  const L = makeLine({ ctrl: [[10, 0], [30, 400], [20, 860]] });
  assert.equal(L.length, N);
  assert.ok(finite(L));
  assert.ok(Math.hypot(L[0][0] - 10, L[0][1]) < 1e-6);
  assert.ok(Math.hypot(L[N - 1][0] - 20, L[N - 1][1] - 860) < 1e-6);
});

test("makeLine rough displaces but keeps endpoints within rough", () => {
  const ctrl = [[100, 0], [100, 860]];
  const flat = makeLine({ ctrl, smooth: false });
  const rough = makeLine({ ctrl, smooth: false, rough: 5, seed: 3 });
  assert.ok(rough.some((q, i) => Math.abs(q[0] - flat[i][0]) > 0.5), "rough moved something");
  for (const i of [0, N - 1]) assert.ok(Math.hypot(rough[i][0] - flat[i][0], rough[i][1] - flat[i][1]) <= 5 * 1.2 + 1e-9);
});

test("noise stays in [0,1] and is deterministic per seed", () => {
  for (let i = 0; i < 1000; i++) {
    const v = noise(i * 0.137, 7);
    assert.ok(v >= 0 && v <= 1);
    assert.equal(v, noise(i * 0.137, 7));
  }
});

test("P clamps s", () => {
  const L = makeLine({ ctrl: [[0, 0], [0, 100]] });
  assert.deepEqual(P(L, -1), L[0]);
  assert.deepEqual(P(L, 2), L[N - 1]);
});
