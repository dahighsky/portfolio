# Portfolio: five lines

A portrait, scroll-driven ink drawing. Five vertical lines flow through eight scenes, and the
story is written over them:

| Scene | Section |
|---|---|
| Mountains | Hero |
| Beach | Now |
| Flights | The travel startup |
| A commodities rate board | Groww commodities |
| Phone and trading terminal | Groww web and app |
| An ETL matching pipeline | Mastercard |
| Receipts, cards and approvals | Fyle (now Sage) |
| A commit graph that becomes a tree | Open source |

As you scroll, each scene's detail melts into the lines, the lines flow into the next shape, and
the new detail grows back out. The brush style follows LingDong's
[{Shan, Shui}*](https://github.com/LingDong-/shan-shui-inf).

The design is in `docs/superpowers/specs/2026-10-17-scroll-scenes-design.md`.

## Run it

ES modules need http, so serve the folder rather than opening the file:

```
python3 -m http.server 8000 -d site
```

Then open http://localhost:8000. To try it on your phone, use your laptop's IP on the same Wi-Fi.

## Edit the words

All copy is in `site/index.html`, one `<section class="block" data-stop="N">` per scene. `N` is
the scene that block sits over (see the order in `site/js/scenes/index.js`). Several blocks can
share a stop.

On wide screens the words are drawn into the scene instead of shown in a card:
- The title (`h1`/`h2`) is handwritten into the left margin, stroke by stroke, when the scene
  comes to rest.
- The eyebrow sits above the title.
- A direct `<p>` in the card becomes a subtitle.
- The `<li>` items are listed under the title, each marked with the scene's own small ink
  bullet: a pine, a surfboard, a coin, a candlestick and so on.

Keep bullets short (one line reads best). The handwriting font is EMS Felix (SIL Open Font
License), in `site/fonts/`.

## Add or change a scene

A scene is a file in `site/js/scenes/` exporting `{ id, title, lines, decorate }`:

- `lines`: exactly five specs, `{ ctrl: [[x, y], …], smooth?, rough?, seed? }`, running top to
  bottom in a 400×860 box. Line 2 is the accent line.
- `decorate(L, add)`: draws the detail. `L` holds the built lines (240 points each). Call
  `add(parent, points, tone, width)` to attach a stroke to line `parent` (0–4), where `tone` is
  `"det"`, `"tex"` (texture) or `"pale"` (distance). Each stroke melts onto its parent line
  during a transition, so attach it to the line it visually belongs to.
- `bullet(x, y)` (optional): the scene's bullet mark for wide screens. It returns polylines
  centred on (x, y), about 24 units across.
- `wings(L, add)` (optional): extra scenery for wide screens only. There the canvas widens to the
  window's shape, with the scene a little right of centre and the text on the left. Draw into
  x < 0 (keep it sparse, it sits under the text) and x > 400. Phones never build it.
- Shape helpers (trees, clouds, planes, glyphs, cylinders, stamps and so on) are in
  `site/js/shapes.js`.

Register the scene in `site/js/scenes/index.js` and give it a text block in `index.html`.

Keep important drawing out of the band the text cards cover (roughly y 560–735), and out of the
mist band around y 620–690.

## Deploy

Pushing to `main` publishes `site/` through `.github/workflows/pages.yml`. In the repo settings,
under Pages, set the source to "GitHub Actions".
