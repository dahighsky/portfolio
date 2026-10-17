# Scroll Scenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ln line-art POC with a portrait, scroll-driven ink drawing. Five vertical
lines flow through ten scenes, and each scene's detail melts into the lines and grows back out.

**Architecture:** Pure ES modules in `site/js/` build each scene's geometry once:
- five lines of `N` points each
- detail strokes anchored to those lines

A pure `frameAt(scenes, p)` turns scroll progress `p` into stroke point lists. A thin DOM layer
converts those to brush-stroke SVG paths. Scroll position maps to `p` through "stops": each text
block marks the scene it sits over.

**Tech Stack:** Plain HTML/CSS/ES modules, no build step, no runtime dependencies. Tests use
Node's built-in test runner (`node --test`, Node ≥ 20). Deploy with a GitHub Actions workflow
that copies files to GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-17-scroll-scenes-design.md`

**Prototype to port from:** `.superpowers/brainstorm/3974-1792215981/content/vertical-shanshui-v2.html`.
Its helpers (`noise`, `catmull`, `linear`, `resample`, `makeLine`, `brush`, `blob`, `tree`,
`pine`, `vbird`, `arc`, `texture`) and its three scenes are working code. Move them into the
modules below rather than rewriting them.

## Global Constraints

- Lines run vertically, top to bottom. Exactly 5 main lines in every scene. Line index 2 is the
  primary line and is drawn in the accent colour.
- `N = 240` points per line, resampled by arc length, ordered top to bottom.
- ViewBox `0 0 400 860`, `preserveAspectRatio="xMidYMid slice"`.
- Main stroke widths: `[3.2, 3, 3.6, 2.6, 2.6]`.
- Colours:
  - paper `#e8dcc4`
  - ink `#1f2a3d`
  - accent `#0f7a5c`
  - the frame outside the strip `#d6c9ae`
  - soft text `#6b6a5e`
- Never orange or terracotta. No serif type; use a sans-serif stack.
- Strip width `min(100vw, 430px)`, centred. On phones the art is a fixed full-screen background.
- Transition phases within one step from scene k to k+1 (`local = p − k`):
  - melt: `clamp((local − 0.08) / 0.24)`
  - flow: `clamp((local − 0.30) / 0.40)`, with a per-line stagger of `i × 0.06` over a `0.76`
    window
  - grow: `clamp((local − 0.68) / 0.24)`
  - each detail's own delay is in `[0, 0.45)` over a `0.55` window
- `prefers-reduced-motion: reduce`: no morphing. Show `round(p)`, with only an opacity
  crossfade between scenes.
- No logos (Mastercard, Groww, Sage or anyone else).
- No build step. A deploy workflow that only copies files is fine.

## Review Focus

1. **Resize or rotate mid-scroll:** the scene under the text must stay correct. Stops are
   recomputed on `resize`, on `ResizeObserver(main)`, and on `document.fonts.ready`. This is
   pinned in Task 5 (`buildStops` is pure over rects) and Task 6 (wiring).
2. **Scroll beyond either end (iOS rubber-banding, overscroll):** `p` stays clamped to
   `[0, SCENES.length − 1]` and is never NaN. Pinned in Task 5.
3. **Jumping several scenes in one frame** (fling, anchor link, keyboard End): the frame depends
   only on `p` and carries no state from the previous frame. Pinned in Task 4.
4. **A typo in the destination config** (unknown landmark type, missing field): it fails loudly
   with a message naming the field, never as a blank or NaN drawing. Pinned in Task 7.
5. **Reduced motion toggled while the page is open:** the page switches modes without a reload.
   Pinned in Task 6.

---

## File Structure

```
site/
  index.html              markup: svg stage, text blocks with data-stop, script entry
  css/style.css           paper, strip layout, cards, reduced motion
  js/geom.js              N, rng, noise, catmull, linear, resample, makeLine, P
  js/brush.js             brush(pts, wid, seed) → SVG path d (filled taper stroke)
  js/shapes.js            detail shape helpers (blob, tree, pine, vbird, arc, texture, + new ones per scene)
  js/scene.js             buildScene(def) → { id, title, lines, det }
  js/morph.js             frameAt(scenes, p) → { mains, strokes }
  js/scroll.js            buildStops(blocks), progressAt(y, stops, count)
  js/render.js            Stage class: draws a frame into the svg, caches rest frames
  js/main.js              wiring: scenes, stops, scroll/resize/fonts/reduced-motion listeners
  js/config.js            DESTINATION object (the one place an owner edits)
  js/landmarks/index.js   landmark registry: { "split-gate": fn, ... }
  js/landmarks/split-gate.js
  js/scenes/index.js      ordered SCENES list
  js/scenes/{mountains,coast,landmark,flights,forex,groww-commodities,groww-terminal,mastercard,sage,oss}.js
tests/
  geom.test.js  brush.test.js  scene.test.js  morph.test.js  scroll.test.js
  config.test.js  scenes.test.js (contract over every registered scene + per-scene invariants)
package.json              { "type": "module", "scripts": { "test": "node --test tests/" } }
.github/workflows/pages.yml
```

Delete: `generator/` and `site/art/` (Task 15).

**Scene definition shape** (every `js/scenes/*.js` default-exports this):

```js
export default {
  id: "mountains",                 // unique, kebab-case
  title: "Mountains",              // used in aria-label
  lines: [spec0, spec1, spec2, spec3, spec4],   // makeLine specs: { ctrl, smooth?, rough?, seed? }
  decorate(L, add) { ... },        // L = built lines; add(parent, pts, tone = "det", wid = 1.3)
};
```

`tone` is one of `"pale" | "tex" | "det"`.

---

### Task 1: Project scaffold and geometry module

**Files:**
- Create: `package.json`, `.gitignore` (`.superpowers/`, `node_modules/`, `.DS_Store`), `site/js/geom.js`, `tests/geom.test.js`
- Run once: `git init` at the repo root (the folder isn't a repo yet)

**Interfaces:**
- Produces, from `site/js/geom.js`:
  - `N = 240`
  - `lerp(a, b, t)`, `clamp(v)` (to [0, 1]), `smooth(t)`
  - `rng(seed) → () => number in (0, 1)`
  - `noise(x, seed = 0) → number in [0, 1]`
  - `catmull(ctrl: [x, y][], steps = 16) → [x, y][]`
  - `linear(ctrl, steps = 12) → [x, y][]`
  - `resample(pts, n) → [x, y][]` (equal arc-length spacing)
  - `makeLine({ ctrl, smooth = true, rough = 0, seed = 1 }) → [x, y][]` (length `N`)
  - `P(L, s) → [x, y]` (the point at fraction `s` along line `L`, clamped)

- [ ] **Step 1: Write failing tests** in `tests/geom.test.js`:
  - `resample returns n points with equal spacing`: resample `[[0,0],[0,100],[100,100]]` to 21
    points. Assert length 21, the first point is `[0,0]`, the last is `[100,100]`, and every gap
    is `10 ± 1e-6`.
  - `resample tolerates duplicate points`: input `[[0,0],[0,0],[0,50]]`. Assert no NaN and the
    last point is `[0,50]`.
  - `makeLine yields N finite points from first to last ctrl` with `rough: 0`.
  - `makeLine rough displaces but keeps endpoints within rough`.
  - `noise stays in [0,1]` over 1000 samples, and is deterministic for the same seed.
  - `P clamps s`: `P(L, -1)` deep-equals `L[0]`, and `P(L, 2)` deep-equals `L[N-1]`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `site/js/geom.js` by moving the prototype's helpers in and exporting
  them. Add `P`.
- [ ] **Step 4:** Run `npm test`. Expected: all geom tests pass.
- [ ] **Step 5:** Commit: `git add -A && git commit -m "chore: scaffold scenes project and geometry module"`

### Task 2: Brush strokes

**Files:** Create `site/js/brush.js`, `tests/brush.test.js`

**Interfaces:**
- Consumes: `noise` from `geom.js`
- Produces: `brush(pts: [x, y][], wid: number, seed = 0) → string`. This is an SVG path `d` for
  one closed filled polygon, `"M…Z"`, or `""` when fewer than 2 distinct points remain.

- [ ] **Step 1: Write failing tests:**
  - `brush returns "" for a single point or all-duplicate points`.
  - `brush never emits NaN`. Try a straight line, a closed circle from `arc` copied inline, a
    2-point line, and a line whose last two points are 1e-9 apart. Assert `!d.includes("NaN")`.
    This guards the prototype's `pow(negative sin)` bug.
  - `brush width tapers`. For a 100px vertical line with `wid 4`, the polygon's horizontal span
    at the midpoint is greater than the span at 2% from each end.
  - `brush is deterministic for the same seed`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Move `brush` from the prototype. Keep the `Math.max(0, sin)` guard, the
  0.35px de-duplication, the `0.18 + 0.82 × sin^0.55` taper and the `0.7 + 0.6 × noise` wobble.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: tapered brush strokes`

### Task 3: Scene builder and shape helpers

**Files:** Create `site/js/scene.js`, `site/js/shapes.js`, `tests/scene.test.js`

**Interfaces:**
- Consumes: `geom.js`
- Produces:
  - `buildScene(def) → { id, title, lines: [x, y][][5], det: Detail[] }`, where
    `Detail = { tone, wid, seed, delay, parent, pts: [i, dx, dy][] }`.
  - `buildScene` throws `Error("scene <id>: expected 5 lines, got <n>")` when the count isn't 5.
  - `add` throws `Error("scene <id>: bad parent <p>")` when the parent isn't 0–4.
  - `shapes.js` exports `blob, tree, pine, vbird, arc, texture`, with the prototype's
    signatures. `texture(add, La, Lb, s0, s1, parents: [a, b], seed, count = 60, maxF = 0.45)`.

- [ ] **Step 1: Write failing tests:**
  - `anchors reproduce the authored points`. Build a scene with five straight vertical lines and
    one detail `[[110,100],[130,140]]` on parent 1. For each point, `L[i] + [dx, dy]` equals the
    authored point within 1e-9.
  - `anchor picks the nearest parent point index`.
  - `delays fall in [0, 0.45)` and `are deterministic per scene id`. Seed the rng from `id`, not
    from `title`, so editing copy doesn't reshuffle the drawing.
  - `throws on 4 lines` and `throws on parent 5`, with the exact messages above.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `buildScene` from the prototype's `scene()`. It takes the definition
  object (shape above) instead of positional arguments. Move the shape helpers into `shapes.js`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: scene builder with line-anchored detail`

### Task 4: Frame interpolation (melt, flow, grow)

**Files:** Create `site/js/morph.js`, `tests/morph.test.js`

**Interfaces:**
- Consumes: built scenes from Task 3
- Produces: `frameAt(scenes, p) → { k, local, mains: [x, y][][5], strokes: { tone, wid, seed, pts }[] }`.
  `p` is clamped to `[0, scenes.length − 1]`. Phase constants are in Global Constraints. A
  detail is omitted when its grow factor is `≤ 0.001`. Its rendered width is
  `wid × (0.4 + 0.6 × g)`.

- [ ] **Step 1: Write failing tests**, using two tiny hand-built scenes:
  - `at integer p the frame equals that scene`. Mains deep-equal `scene.lines`, and every
    detail sits at its authored position with full width.
  - `at p = k + 0.30 old detail has fully melted`: every old detail is omitted or has all points
    on its parent line.
  - `between 0.30 and 0.68 no detail is drawn` (both melted and not yet grown).
  - `lines stagger`: at `local 0.5`, line 0 has moved further toward B than line 4.
  - `stateless`: `frameAt(s, 6.8)` deep-equals itself whether called cold or after
    `frameAt(s, 1.2)`. Review Focus 3.
  - `clamps p`: `frameAt(s, -3)` equals `frameAt(s, 0)`, `frameAt(s, 99)` equals the last scene,
    and `frameAt(s, NaN)` equals `frameAt(s, 0)`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement it from the prototype's `render`, minus the DOM. Handle the last
  scene (`p === length − 1`) by returning that scene at rest.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: stateless melt/flow/grow frame interpolation`

### Task 5: Scroll stops → progress

**Files:** Create `site/js/scroll.js`, `tests/scroll.test.js`

**Interfaces:**
- Produces:
  - `buildStops(blocks: { top: number, height: number, stop: number }[], viewportH) → { y, k }[]`.
    `y` is the scrollY at which the block's centre is at viewport centre. Sort by `y`.
  - `progressAt(scrollY, stops, count) → number`. This is piecewise-linear interpolation of `k`
    over `y`. It is flat between consecutive stops with the same `k`, and clamped to
    `[0, count − 1]` and to the first and last stop.

- [ ] **Step 1: Write failing tests:**
  - `hero and Now share stop 0`: blocks at stops `0, 0, 1` give 0 anywhere between the first
    two, and 0.5 halfway between the second and third.
  - `clamps before first and after last stop`. Review Focus 2: `scrollY −500` gives 0, and
    `scrollY 1e9` gives `count − 1`.
  - `never NaN with a single stop or zero-height blocks`.
  - `buildStops is pure over rects`: the same input gives the same output, and changing
    `viewportH` shifts every `y` by half the difference. Review Focus 1.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement both functions.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: map scroll position to scene progress via text stops`

### Task 6: Page shell, renderer, first two scenes

**Files:**
- Replace: `site/index.html`
- Create: `site/css/style.css`, `site/js/render.js`, `site/js/main.js`, `site/js/scenes/index.js`,
  `site/js/scenes/mountains.js`, `site/js/scenes/coast.js`, `tests/scenes.test.js`

**Interfaces:**
- Consumes: Tasks 1–5
- Produces:
  - `class Stage { constructor(svg: SVGSVGElement); draw(frame): void }`.
    - It owns 8 paths: `#pale`, `#tex`, `#det` and `#m0`–`#m4`, with `#m2` in the accent colour.
    - It sits inside a mist mask group copied from the prototype.
    - It caches the `d` strings of any frame with `local === 0` per scene index, so resting
      frames don't re-tessellate.
  - `SCENES` (ordered array of scene definitions) from `scenes/index.js`.
  - Markup contract: every text block is `<section class="block" data-stop="K">`.

- [ ] **Step 1: Write a failing contract test** in `tests/scenes.test.js`. For every definition
  in `SCENES`:
  - `buildScene` succeeds
  - every line has `N` finite points with `y` non-decreasing within ±40px (top to bottom)
  - every detail parent is in 0–4

  Then for `p` from 0 to `SCENES.length − 1` in steps of 0.05, assert that no `brush()` output
  from `frameAt` contains NaN. Add per-scene invariants:
  - mountains: `L0[0]` and `L1[0]` are within 1px (the shared peak)
  - coast: all five lines span `y ≤ 0` to `y ≥ 860` (the bay runs off both edges)
- [ ] **Step 2:** Run `npm test`. Expected: FAIL (no scenes yet).
- [ ] **Step 3:** Port the prototype's mountains and coast scenes into the definition shape.
  Write `index.html` with:
  - the fixed stage
  - a hero block and a Now block (`data-stop="0"`)
  - one placeholder block (`data-stop="1"`)

  In `style.css`:
  - the paper texture from the prototype
  - the strip layout from Global Constraints
  - translucent paper cards
  - `section.block { min-height: 100svh; }` so each transition gets a screen of scroll

  `main.js` builds the scenes once, then recomputes stops on load, `resize`,
  `ResizeObserver(document.querySelector("main"))` and `document.fonts.ready`. It draws on
  `scroll` through `requestAnimationFrame`, at most once per frame. Under reduced motion it
  draws `frameAt(scenes, Math.round(p))` and fades the svg (opacity 0 → 1 over 300ms) when the
  rounded scene changes. It listens for `change` on the media query (Review Focus 5).
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Visual check.**
  1. Run `python3 -m http.server 8000 -d site`. ES modules need http, not `file://`.
  2. Open it in the browser pane at 375×812, then at desktop width.
  3. Check that scroll morphs mountains → coast with melt, then flow, then grow.
  4. Check that desktop shows a centred strip on `#d6c9ae`.
  5. Check that emulating reduced motion snaps between scenes with a fade.
  6. Check that the console has no errors.
- [ ] **Step 6:** Commit: `feat: scroll-driven stage with mountains and coast`

### Task 7: Configurable destination and landmark registry

**Files:** Create `site/js/config.js`, `site/js/landmarks/index.js`,
`site/js/landmarks/split-gate.js`, `site/js/scenes/landmark.js`, `tests/config.test.js`.
Modify `site/js/scenes/index.js` and `index.html` (add a block with `data-stop="2"`).

**Interfaces:**
- Produces:
  - `DESTINATION = { name: "Bali (mock)", landmark: { type: "split-gate", params: { tiers: 4 } }, copy: { mountains, coast, landmark } }`
  - `LANDMARKS: Record<string, (params) => { lines, decorate }>`
  - `resolveDestination(cfg) → { lines, decorate }`. It throws
    `Error('destination.landmark.type "<t>" is not one of: split-gate')`, and
    `Error("destination.<field> is required")` for a missing `name`, `landmark` or `copy`.
  - `scenes/landmark.js` builds its definition from `resolveDestination(DESTINATION)`.
  - `main.js` fills each block's text from `DESTINATION.copy`, wherever an element has
    `data-copy="mountains|coast|landmark"`.

- [ ] **Step 1: Write failing tests:**
  - `unknown landmark type throws a message naming the field and the allowed types` (Review
    Focus 4)
  - `missing name throws "destination.name is required"`
  - `tiers param changes geometry`: tiers 3 and 4 give different line 0
  - the contract test from Task 6 now also covers `landmark`, with this invariant: L0 and L1
    share a top point and L3 and L4 share a top point (the two spires)
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Port the prototype's temple gate into `split-gate.js` and parameterise the
  tier count. Write the config, the registry and `resolveDestination`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Visual check at 375×812: mountains → coast → gate, with copy from the config.
- [ ] **Step 6:** Commit: `feat: configurable destination with split-gate landmark`

### Tasks 8–14: One task per work scene

Every scene task has the same five steps:
1. Add the invariant test to `tests/scenes.test.js` and register the scene in
   `scenes/index.js`.
2. Run `npm test`. Expected: FAIL.
3. Draw the scene in `site/js/scenes/<id>.js`. Add any new shape helpers to `shapes.js` with a
   one-line JSDoc each. Add a text block with the next `data-stop` to `index.html`, using
   placeholder copy marked `<!-- owner copy -->`.
4. Run `npm test`. Expected: PASS.
5. Visual check in the browser pane at 375×812: this scene at rest, plus the transition in from
   the previous scene. Check that it reads as the imagery below without its caption. Then
   commit with `feat: <id> scene`.

Detail density should match the mountains: at least 40 detail strokes, using all three tones.
Texture strokes go wherever two lines bound a surface.

**Task 8, `flights`.** Contrails come down out of shan-shui clouds (layered blob outlines, pale)
and land on a runway seen from above. Line 2 is the runway centre line. Lines 1 and 3 are the
runway edges, lower half only. Line 2 has dashed centre markings as `det` strokes. Add 2–3 small
plane silhouettes on the contrails, a control tower beside the runway, and taxiway markings.
- Invariants: line 2's x stays within ±4px over `s ∈ [0.5, 1]` (straight runway). Over
  `s ∈ [0.6, 1]`, lines 1 and 3 sit 30–90px either side of line 2.

**Task 9, `forex`.** An airport currency-exchange board. The five lines are near-vertical column
dividers. Rows of rates are drawn as short ink strokes, split-flap style, with faint ₹ $ € £ ¥
glyphs drawn as stroked paths (no text nodes). Coins (circles with inner rims) and fanned notes
sit at the foot, and a counter ledge crosses the bottom.
- Invariants: each line's x varies by less than 3px over `s ∈ [0.1, 0.9]`, and the mean x
  strictly increases from line 0 to line 4.

**Task 10, `groww-commodities`.** Lines 0 and 1 meet at the top of an oil derrick (lattice
cross-bracing as `det` strokes between them) with a pump jack nearby. Line 2 carries crude down
into barrels (stacked cylinders, from the side). Lines 3 and 4 bound a stack of gold bars
(trapezoids, with a glint mark on the top bar).
- Invariants: L0 and L1 share a top point within 1px. Line 2's last point is below `y = 700`.

**Task 11, `groww-terminal`.** The same five lines straighten into device edges. Lines 0 and 1
are the phone's sides; lines 3 and 4 are the desktop terminal's sides; line 2 runs down the gap
as the accent price line. Both screens show candlestick charts whose wicks are vertical `det`
strokes and whose bodies are small rectangles. Add an order-book ladder on the terminal, a
buy/sell button outline on the phone, and gold/crude tickers as squiggle-plus-glyph strokes. It
must not read as "just a chart": the devices and the commodities context carry the scene.
- Invariants: lines 0, 1, 3 and 4 are straight (x varies under 2px over `s ∈ [0.2, 0.8]`), and
  the phone is narrower than the terminal: `x1 − x0 < x4 − x3`.

**Task 12, `mastercard`.** An ETL pipeline from top to bottom.
- **Top:** thin streams, as `det` strokes anchored across all lines, come from small industry
  icons (shop awning, plane, fuel pump, cart) and arrive in batches (stacked record ticks).
- **Middle, the matching stage:** lines 0 and 1 converge, and lines 3 and 4 converge. Matched
  record pairs drawn beside them join, while unmatched ticks drift outward.
- **Bottom:** load into stacked cylinders (data stores).
- No logos and no interlocking circles.
- Invariants: at `s = 0.5`, `|L0.x − L1.x| ≤ 2` and `|L3.x − L4.x| ≤ 2`. At `s = 0.1` both
  pairs are at least 40px apart.

**Task 13, `sage`.** A long receipt unrolls down the screen.
- Lines 1 and 3 are its straight sides. Line 2 is the torn edge, a zigzag accent line, set in
  near line 3.
- Rows of expense entries are ink strokes. Corporate cards fan out beside it (rounded
  rectangles with a chip mark and, on lines 0–1, an embossed number dash row).
- An approval chain of stamp circles with ticks runs down to a double-ruled total.
- A small traveller with a suitcase stands at the foot.
- Invariants: line 2 has at least 20 direction changes in x (the zigzag). Lines 1 and 3 are
  straight (under 2px variation) for `s ∈ [0.1, 0.9]`.

**Task 14, `oss`.** Line 2 is main. Lines 1 and 3 are feature branches: they start on main,
peel off and merge back. Lines 0 and 4 are longer-lived branches doing the same further out.
Commits are small ink knots (`blob`) on every line. Toward the bottom the graph turns into a
shan-shui tree: line 2 thickens into a trunk with `tree()` foliage, and the branches end in
leaf blobs. The scroll ends back in a landscape.
- Invariants: L1 and L3 each start within 2px of a line-2 point, and each pass a line-2 point
  again within 2px at some `s > 0.3` (the merge).

### Task 15: Content, cleanup, deploy

**Files:**
- Modify: `site/index.html` (final block order and copy placeholders), `README.md`
- Create: `.github/workflows/pages.yml`
- Delete: `generator/`, `site/art/`

**Block order:**

| Stop | Content |
|------|---------|
| 0 | hero, Now |
| 1–4 | travel startup: one heading "Travel, as a fintech problem" over the coast, then short beats over landmark, flights and forex |
| 5–6 | Groww commodities: one heading, two beats |
| 7 | Mastercard |
| 8 | Sage (formerly Fyle) |
| 9 | Open source |
| 9 | footer |

Keep the existing placeholder copy and links from the old page where they apply. Every heading
gets an `id` for anchors.

- [ ] **Step 1:** Add a test to `tests/scenes.test.js` that parses `site/index.html` with a regex
  for `data-stop="(\d+)"`. Assert the stops are non-decreasing in document order, the maximum
  equals `SCENES.length − 1`, and every scene index from 0 to the maximum has at least one
  block.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL until the blocks are in place, then PASS after
  Step 3.
- [ ] **Step 3:** Write the blocks. Delete `generator/` and `site/art/`.
- [ ] **Step 4:** Write `pages.yml` with `actions/upload-pages-artifact` from the `site` path
  and `actions/deploy-pages`. Trigger on push to `main`, with permissions `pages: write` and
  `id-token: write`. No build step.
- [ ] **Step 5:** Rewrite `README.md`:
  - how to run: `python3 -m http.server 8000 -d site`
  - how to test: `npm test`
  - how to change the destination: edit `site/js/config.js`, or add a landmark under
    `site/js/landmarks/`
  - how to add a scene
- [ ] **Step 6:** Run `npm test`. Expected: PASS. Do the visual check: a full scroll from top to
  bottom at 375×812 and at desktop width, with no console errors.
- [ ] **Step 7:** Commit: `feat: final content order, Pages deploy, remove ln generator`

### Task 16: Performance pass on a phone profile

**Files:** Modify `site/js/render.js` and `site/js/main.js` only if the measurement fails.

- [ ] **Step 1:** In the browser pane at 375×812, run this through the JS tool:
  `performance.now()` around 200 calls of `stage.draw(frameAt(scenes, p))` for `p` evenly spread
  across `[0, SCENES.length − 1]`. Expected: mean under 6ms and p95 under 12ms. That leaves
  headroom for a 4×-slower phone at 60fps, or about 30fps worst case.
- [ ] **Step 2:** If it fails, apply these in order until it passes, re-measuring after each:
  1. Skip tone groups whose strokes are all at full growth and whose parents haven't moved,
     reusing the cached `d`.
  2. Lower the brush resampling (decimate stroke points with spacing under 1.5px before
     tessellation).
  3. Draw `tex` with fixed-width plain polylines during transitions.
- [ ] **Step 3:** Run `npm test`. Expected: PASS. Repeat the full-scroll visual check.
- [ ] **Step 4:** Commit: `perf: keep frame cost within phone budget`
