import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScene } from "../site/js/scene.js";

const straight = x => ({ ctrl: [[x, 0], [x, 860]], smooth: false });
const def = (over = {}) => ({
  id: "probe", title: "Probe",
  lines: [straight(40), straight(120), straight(200), straight(280), straight(360)],
  decorate(L, add) { add(1, [[110, 100], [130, 140]]); add(3, [[300, 500], [290, 520]], "tex", 0.8); },
  ...over,
});

test("anchors reproduce the authored points", () => {
  const s = buildScene(def());
  const d = s.det[0], L = s.lines[d.parent];
  const authored = [[110, 100], [130, 140]];
  d.pts.forEach(([i, dx, dy], k) => {
    assert.ok(Math.abs(L[i][0] + dx - authored[k][0]) < 1e-9);
    assert.ok(Math.abs(L[i][1] + dy - authored[k][1]) < 1e-9);
  });
});

test("anchor picks the nearest parent point index", () => {
  const s = buildScene(def());
  const L = s.lines[1], [i] = s.det[0].pts[0];
  const dist = j => (L[j][0] - 110) ** 2 + (L[j][1] - 100) ** 2;
  for (let j = 0; j < L.length; j++) assert.ok(dist(i) <= dist(j));
});

test("delays fall in [0, 0.45) and are deterministic per scene id", () => {
  const a = buildScene(def()), b = buildScene(def({ title: "Renamed" }));
  for (const d of a.det) assert.ok(d.delay >= 0 && d.delay < 0.45);
  assert.deepEqual(a.det.map(d => d.delay), b.det.map(d => d.delay));
  assert.equal(a.det[1].tone, "tex");
  assert.equal(a.det[1].wid, 0.8);
});

test("throws on 4 lines", () => {
  assert.throws(() => buildScene(def({ lines: def().lines.slice(0, 4) })), { message: "scene probe: expected 5 lines, got 4" });
});

test("throws on parent 5", () => {
  assert.throws(() => buildScene(def({ decorate: (L, add) => add(5, [[0, 0]]) })), { message: "scene probe: bad parent 5" });
});
