# Portfolio: ln line-art POC

Proves the core idea: generate line art with [fogleman/ln](https://github.com/fogleman/ln) in Go,
export it as SVG path data, and draw it in the normal DOM, mobile first.

## Layout

```
portfolio/
  generator/        Go program that renders the ln scenes
    main.go         scenes: globe + flight arc, candlesticks + trend, ledger + tally,
                    payment network + route, git commit graph
  site/
    index.html      mobile-first demo page (plain HTML/CSS/JS, no build step)
    art/art.js      generated: window.LN_ART = { name: { w, h, layers } }
    art/*.svg       generated: static previews
```

## Run it

1. Install Go from https://go.dev/dl (1.22 or newer).
2. Generate the art:
   ```
   cd generator
   go mod tidy
   go run .
   ```
3. Open `site/index.html` in your browser. To test on your phone, serve it on your network:
   ```
   cd site
   python -m http.server 8000
   ```
   then open `http://<your-laptop-ip>:8000` on the phone (same Wi-Fi). Use Chrome DevTools'
   device mode for quick checks.

## What the POC demonstrates

- **Layers.** Each scene exports named layers (`grid`, `arc`, `candles`, `trend`, `sheet`, `bars`,
  `tally`, `nodes`, `links`, `route`, `commits`, `branches`, `main`). The `DRAWN` and `FADED` sets in
  `index.html` decide which layers draw on scroll and which fade in. CSS styles each
  one, and JS animates them separately.
- **Hidden lines across layers.** `occluder` wraps a shape so it blocks lines without drawing,
  which is how the flight arc disappears behind the globe while living in its own layer.
- **Direction of drawing.** The trend line's points are reversed in Go, so on scroll it draws
  right to left (today first) but reads as a normal left-to-right uptrend.
- **DOM-aware connector.** The green spine is built in JS from the live position of every
  `.node` element and rebuilt on resize, so it follows your layout whatever the content.
- **Scroll-drawn strokes,** with `prefers-reduced-motion` showing everything fully drawn.
- **Light and dark mode** via CSS variables.

## Adding a new piece of art

1. Write a function in `main.go` returning `fit(map[string]ln.Paths{...}, padding)`.
2. Register it in `main()` under a name.
3. Run `go run .`, then use `<svg class="art" data-art="yourName"></svg>` in the page and style
   its layers in CSS.

## Notes

- `go.mod` has a `replace` for `golang.org/x/image` pointing at its GitHub mirror. It's harmless;
  you can remove it if `go mod tidy` works without it on your machine.
- Text placeholders ("Your Name", role lines) are meant to be replaced with real content.

## Next steps

- Place job markers along the candlestick trend line with `getPointAtLength`.
- Rough.js for the hand-drawn final section.
- Deploy `site/` to GitHub Pages.
