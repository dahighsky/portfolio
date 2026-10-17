# Portfolio: five lines, one scroll of scenes

Date: 2026-10-17
Status: draft for review

## Intent

The portfolio is one continuous ink drawing that changes as you scroll, with the story written
over it. The art is the background, not illustrations beside the text. It moves through a
sequence of scenes, and each scene turns into the next instead of cutting to it.

The core idea is **the lines**. Five prominent lines persist through every scene and flow
cleanly from one shape into the next. Each scene is rich: the five lines are the skeleton, and
detail grows around them. During a transition the detail **melts into** its line, the five lines
flow into their new shapes, and the new scene's detail **grows back out** of them.

Why: a "line running down the page" with downloaded-looking assets read as generic. Scenes that
transform into each other say "one person, one continuous story" and feel made, not assembled.

## The story (scene order, top to bottom)

Scenes 1–3 are the owner's current travel startup (hotels, then forex, then flights). They form
one story section with sub-beats, not three peer sections. *Claude's call, read from the owner's
description and the earlier copy "hotels first, then forex, then flights".*

1. **Travel (now)**, in three beats that use a configurable destination:
   1. Mountains
   2. Beach / coast
   3. A landmark for the destination
2. **Flights:** contrails come down out of clouds and land on a runway seen from above. The
   green line is the runway centre line. Planes and a control tower.
3. **Forex:** an airport currency-exchange board. The five lines are the board's column
   dividers, with rates in the rows. Coins, notes, faint ₹ $ € £ ¥.
4. **Groww: commodities.** The owner built Groww's commodities trading business from the ground
   up and worked on web and app. This must not read as "just a chart". Two lines meet at the top
   of an oil derrick (like a peak). Crude flows down the green line into barrels and stacked gold
   bars. The lines then straighten into the edges of a phone and a desktop trading terminal side
   by side, both showing candlestick charts whose wicks grow out of the lines.
5. **Mastercard: big data, ML, ETL matching** (internship). An ETL pipeline runs top to bottom:
   extract, transform, load. Many thin streams from different industries (shop, plane, fuel
   pump, cart) pour in as batches. At the matching stage records pair up: matched pairs merge
   into one line, and unmatched records drift aside. No logos.
6. **Sage (formerly Fyle): expense and corporate card management** (internship). A long receipt
   unrolls down the screen with the green line as its torn edge. Corporate cards fan out beside
   it. An approval chain of stamps and ticks runs down to a reimbursed total. A small traveller
   with a suitcase links back to travel.
7. **Open source.** A new section of its own, about open source work only. The old "FOSS club"
   framing goes. *Imagery is Claude's call; the owner hasn't seen it:* the five lines become
   git branches running down the screen. Main is the green line, feature branches peel off and
   merge back, and commits are small knots. The graph gradually becomes a shan-shui tree, so the
   scroll ends back in a landscape where it began.

The owner approved this imagery as proposed. Exact drawings are the builder's to work out
within it.

## Goals

- The five lines are always visible and always continuous. Every transition is a smooth flow of
  the same five lines, never a cut, fade-swap or replacement.
- Each scene is detailed enough to read as a place or a moment on its own.
- Detail melts onto its parent line and grows back out of it during transitions.
- Portrait first: the phone screen is the primary canvas.
- The look is graceful, in the manner of LingDong's {Shan, Shui}* (see Style).
- The travel destination is configurable. The owner will supply real places later, so ship with
  a mock destination.

## Non-goals

- Landscape or wide-screen compositions. Desktop shows the same portrait art (see Layout).
- 3D rendering. The earlier fogleman/ln (Go) proof of concept is superseded.
- A CMS or build pipeline.
- Dark mode (the design is paper and ink). *Builder's call, see below.*

## Anti-goals (a failure even if it works)

- Looking like stock assets or icons dropped onto a page.
- A single line wandering down the page with things placed beside it. That was the rejected POC.
- Looking like Claude's visual identity: terracotta/orange accent, pale cream background, serif
  type.
- Work scenes that reduce to a generic chart.

## Style

- **Lines run vertically,** top to bottom of the screen, like a Chinese hanging scroll. The owner
  chose this over horizontal stacked lines after seeing both prototypes.
- **Brush strokes, not hairlines.** Every stroke is a filled shape whose width tapers with
  `sin(πt)` and wobbles with smooth noise, as in {Shan, Shui}*'s `stroke()`. Main lines are
  heavier, detail lighter, and texture lightest.
- **Mountain texture:** short, faint strokes between contour lines, denser near the edges, as in
  {Shan, Shui}*'s `texture()`.
- **Depth:** distant things are drawn paler. Mist is made by fading the ink out in soft bands with
  an SVG mask, so the paper shows through untouched.
- **Paper:** beige paper with a visible but quiet texture (fine grain, faint fibres, a slight
  vignette).
- **Colour:** dark navy ink. One accent colour on the primary (third) line. The prototypes use
  deep green `#0f7a5c`, and the accent must not be orange or terracotta.
- **Type:** sans-serif (the prototypes use the system UI font; the earlier POC used IBM Plex
  Sans). No serif display type.

Reference: https://github.com/LingDong-/shan-shui-inf. Take the techniques, but don't copy code
wholesale. Its licensing is unverified.

## Layout

- **Phone:** the art fills the screen as a fixed background, and the content scrolls over it.
- **Laptop/desktop:** a tall centred strip, like a hanging scroll on a wall, roughly phone width
  (the prototypes use `min(100vw, 430px)`). The area around it is a plain darker paper tone. The
  owner chose this.
- **Text:** each scene's text sits over that scene while it's on screen, on a translucent paper
  card so it stays readable over the ink. The owner confirmed this from the playback. The exact
  card styling and position are the builder's.
- **Content:** hero (name, one-line pitch, links: GitHub, X, LinkedIn, email), "Now" (exploring,
  shipped), then one block per scene, ending with Open source and a short footer. *Claude's call:*
  the hero sits over the mountains at rest, "Now" sits over the mountains too (before the first
  transition), and the travel-startup text then spans the coast, landmark, flights and forex
  beats. The owner will replace the placeholder copy, and the text
  in `site/index.html` is a starting point.

## Mechanics (validated in prototypes)

These prototypes show the approach works:
- `.superpowers/brainstorm/*/content/vertical-shanshui-v2.html` (chosen direction)
- `melt-portrait-v5.html` (stacked variant, rejected)

How it works:
- **Lines:** each of the five lines is N points (the prototype uses 240), resampled by arc length
  and ordered top to bottom. A transition interpolates the points one-to-one, both x and y.
- **Detail:** each detail stroke stores, for every point, the nearest point index on a parent line
  plus an offset. It renders at `parent[i] + offset * g`. As `g` goes 1 → 0 the detail melts onto
  the line, and as `g` goes 0 → 1 it grows out. Each detail gets a random delay so melting and
  growing look organic, not uniform.
- **Transition timing:** within a transition, in order: rest, melt, flow, grow, rest. The five
  lines flow with a small per-line stagger so they move one after another rather than in
  lockstep.
- **Scroll:** scroll position maps to scene progress.

## Configurable destination

The destination lives in one data object with its name, its landmark and its scene copy. For
now, ship one mock destination: "Bali-ish" mountains, coast and a split temple gate.

Exactly one destination is active, chosen in that config. There's no rotation and no visitor
choice. *Claude's call.* The owner will add real inputs later. How much the landmark drawing is parameterised (a fixed set
of landmark types to pick from, or a drawing function per destination) is the builder's call, as
long as adding a destination doesn't mean editing the rendering code.

## Constraints

- Plain HTML/CSS/JS, no build step. This continues the existing `site/` approach. *Owner's
  earlier setup.*
- It must hold a smooth frame rate while scrolling on a mid-range phone.
- `prefers-reduced-motion`: no morphing animation. Show each scene's finished drawing; the
  builder decides how it changes between scenes (a simple crossfade is acceptable here only).
- Deployment target: GitHub Pages, serving `site/` (from the earlier README's next steps).

## Decided by Claude (owner can override)

- Drop the Go/ln generator. The art is generated procedurally in the browser in JS, because the
  2D brush and melt mechanics don't need 3D hidden-line removal.
- Light paper only, no dark mode.
- Accent colour: deep green `#0f7a5c`.
- Groww's two beats (derrick/barrels/gold, then phone + terminal) get a full melt, flow and grow
  transition between them, like the travel beats.
- GitHub Pages deploys `site/` through a small GitHub Actions workflow that copies files and
  doesn't build anything. The folder isn't a git repo yet.
- Open source imagery (git branches turning into a tree).

## Left to the builder

- The exact drawing of every scene within the imagery above, plus detail density and seeds.
- Transition timing curves and how much scroll each scene and transition gets.
- Rendering strategy for performance: SVG paths vs canvas, caching scene geometry, and whether to
  re-tessellate brush strokes every frame.
- Text card design and placement, and the hero treatment.
- How the scroll scrub relates to section anchors and links.
- File structure inside `site/`.
