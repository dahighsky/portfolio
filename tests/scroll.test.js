import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStops, progressAt } from "../site/js/scroll.js";

const VH = 800;
// block centre at viewport centre ⇒ y = top + height/2 − vh/2
const blocks = [{ top: 0, height: 800, stop: 0 }, { top: 800, height: 800, stop: 0 }, { top: 1600, height: 800, stop: 1 }];

test("hero and Now share stop 0", () => {
  const stops = buildStops(blocks, VH);
  assert.deepEqual(stops, [{ y: 0, k: 0 }, { y: 800, k: 0 }, { y: 1600, k: 1 }]);
  assert.equal(progressAt(400, stops, 2), 0);
  assert.equal(progressAt(1200, stops, 2), 0.5);
});

test("clamps before first and after last stop", () => {
  const stops = buildStops(blocks, VH);
  assert.equal(progressAt(-500, stops, 2), 0);
  assert.equal(progressAt(1e9, stops, 2), 1);
  assert.equal(progressAt(1e9, [{ y: 0, k: 0 }, { y: 100, k: 7 }], 3), 2);
});

test("never NaN with a single stop or zero-height blocks", () => {
  const one = buildStops([{ top: 100, height: 0, stop: 0 }], VH);
  for (const y of [-1, 0, 50, 1e6]) assert.equal(progressAt(y, one, 1), 0);
  const flat = buildStops([{ top: 100, height: 0, stop: 0 }, { top: 100, height: 0, stop: 1 }], VH);
  for (const y of [-1, 0, 1e6]) assert.ok(Number.isFinite(progressAt(y, flat, 2)));
  assert.equal(progressAt(5, [], 3), 0);
  assert.equal(progressAt(NaN, flat, 2), 0);
});

test("buildStops is pure over rects", () => {
  const a = buildStops(blocks, VH), b = buildStops(blocks, VH);
  assert.deepEqual(a, b);
  const c = buildStops(blocks, VH + 200);
  c.forEach((s, i) => assert.equal(s.y, a[i].y - 100));
});

test("stops are sorted by y", () => {
  const s = buildStops([...blocks].reverse(), VH);
  assert.deepEqual(s.map(x => x.y), [0, 800, 1600]);
});
