import { test } from "node:test";
import assert from "node:assert/strict";
import { brush } from "../site/js/brush.js";

const arc = (cx, cy, r, a0, a1, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
  const a = a0 + (a1 - a0) * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const polygon = d => d.slice(1, -1).split("L").map(s => s.split(" ").map(Number));

test('brush returns "" for a single point or all-duplicate points', () => {
  assert.equal(brush([[5, 5]], 3), "");
  assert.equal(brush([[5, 5], [5, 5], [5.1, 5]], 3), "");
});

test("brush never emits NaN", () => {
  const cases = [
    [[0, 0], [0, 100]],
    Array.from({ length: 50 }, (_, i) => [0, i * 2]),
    arc(50, 50, 20, 0, Math.PI * 2, 24),
    [...Array.from({ length: 30 }, (_, i) => [i * 3, i]), [87 + 1e-9, 29]],
    // (π·22.46)/22.46 rounds just above π, so sin() at the stroke's end is slightly negative
    [[0, 0], [0, 22.46]],
  ];
  for (const pts of cases) for (const seed of [0, 1, 7.3]) {
    const d = brush(pts, 3, seed);
    assert.ok(d.startsWith("M") && d.endsWith("Z"));
    assert.ok(!d.includes("NaN"), d.slice(0, 80));
  }
});

test("brush width tapers", () => {
  const pts = Array.from({ length: 101 }, (_, i) => [0, i]);
  const poly = polygon(brush(pts, 4, 0));
  const span = y => { const xs = poly.filter(q => Math.abs(q[1] - y) < 0.6).map(q => q[0]); return Math.max(...xs) - Math.min(...xs); };
  assert.ok(span(50) > span(2), `mid ${span(50)} vs start ${span(2)}`);
  assert.ok(span(50) > span(98), `mid ${span(50)} vs end ${span(98)}`);
});

test("brush is deterministic for the same seed", () => {
  const pts = arc(0, 0, 40, 0, 3, 20);
  assert.equal(brush(pts, 2, 5), brush(pts, 2, 5));
});
