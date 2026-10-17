// Command generator renders the portfolio's line art with fogleman/ln and
// writes it as SVG path data the website can style and animate.
//
// Run from this folder:  go run .
// Output:                ../site/art/art.js   (window.LN_ART = {...})
//
//	../site/art/*.svg    (static previews)
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"os"
	"path/filepath"
	"strings"

	"github.com/fogleman/ln/ln"
)

// ---------- helpers ----------

// occluder hides lines behind a shape without drawing the shape itself.
// Lets us render one layer (e.g. the flight arc) with correct hidden-line
// removal while the globe's own lines live in a separate layer.
type occluder struct{ ln.Shape }

func (o occluder) Paths() ln.Paths { return nil }

// pathShape is a free-floating 3D polyline: it draws but never blocks.
type pathShape struct{ path ln.Path }

func (p *pathShape) Compile() {}
func (p *pathShape) BoundingBox() ln.Box {
	return ln.BoxForVectors(p.path)
}
func (p *pathShape) Contains(ln.Vector, float64) bool { return false }
func (p *pathShape) Intersect(ln.Ray) ln.Hit          { return ln.NoHit }
func (p *pathShape) Paths() ln.Paths                  { return ln.Paths{p.path} }

type camera struct {
	eye, center, up ln.Vector
	w, h, fovy      float64
}

func (c camera) render(shapes ...ln.Shape) ln.Paths {
	scene := ln.Scene{}
	for _, s := range shapes {
		scene.Add(s)
	}
	return scene.Render(c.eye, c.center, c.up, c.w, c.h, c.fovy, 0.1, 100, 0.01)
}

// fit converts named layers of ln paths into SVG "d" strings, flipping Y so
// the origin is top-left and cropping the viewBox tightly around the art.
func fit(layers map[string]ln.Paths, pad float64) Art {
	minX, minY := math.Inf(1), math.Inf(1)
	maxX, maxY := math.Inf(-1), math.Inf(-1)
	for _, paths := range layers {
		for _, p := range paths {
			for _, v := range p {
				minX, maxX = math.Min(minX, v.X), math.Max(maxX, v.X)
				minY, maxY = math.Min(minY, -v.Y), math.Max(maxY, -v.Y)
			}
		}
	}
	art := Art{W: math.Ceil(maxX - minX + 2*pad), H: math.Ceil(maxY - minY + 2*pad), Layers: map[string]string{}}
	for name, paths := range layers {
		var b strings.Builder
		for _, p := range paths {
			if len(p) < 2 {
				continue
			}
			for i, v := range p {
				cmd := "L"
				if i == 0 {
					cmd = "M"
				}
				fmt.Fprintf(&b, "%s%.1f %.1f", cmd, v.X-minX+pad, -v.Y-minY+pad)
			}
		}
		art.Layers[name] = b.String()
	}
	return art
}

// Art is one illustration: a viewBox plus named layers the site animates
// independently.
type Art struct {
	W      float64           `json:"w"`
	H      float64           `json:"h"`
	Layers map[string]string `json:"layers"`
}

// ---------- scenes ----------

// globe: lat/lng wireframe plus a flight arc lifted off the surface.
func globe() Art {
	cam := camera{
		eye:    ln.LatLngToXYZ(22, 64, 3.6),
		center: ln.Vector{},
		up:     ln.Vector{0, 0, 1},
		w:      600, h: 600, fovy: 40,
	}
	sphere := ln.NewSphere(ln.Vector{}, 1)

	// Bengaluru → Dubai → London, rising and falling like a flight path.
	stops := [][2]float64{{12.97, 77.59}, {25.2, 55.27}, {51.5, -0.13}}
	var arc ln.Path
	for s := 0; s < len(stops)-1; s++ {
		a, b := stops[s], stops[s+1]
		for i := 0; i <= 120; i++ {
			t := float64(i) / 120
			lat := a[0] + (b[0]-a[0])*t
			lng := a[1] + (b[1]-a[1])*t
			r := 1 + 0.22*math.Sin(math.Pi*t)
			arc = append(arc, ln.LatLngToXYZ(lat, lng, r))
		}
	}

	return fit(map[string]ln.Paths{
		"grid": cam.render(sphere),
		"arc":  cam.render(occluder{ln.NewSphere(ln.Vector{}, 1)}, &pathShape{arc}),
	}, 8)
}

// candles: 3D candlesticks trending up, plus a close-price line drawn
// right-to-left so the scroll animation starts at "today".
func candles() Art {
	cam := camera{
		eye:    ln.Vector{5, -15, 6},
		center: ln.Vector{0, 0, 2.8},
		up:     ln.Vector{0, 0, 1},
		w:      800, h: 500, fovy: 30,
	}
	rng := rand.New(rand.NewSource(7))
	const n = 9
	var shapes []ln.Shape
	var trend ln.Path
	price := 1.0
	for i := 0; i < n; i++ {
		x := (float64(i) - (n-1)/2.0) * 1.2
		open := price
		price += 0.35 + (rng.Float64()-0.4)*0.9 // drifts upward
		lo, hi := math.Min(open, price), math.Max(open, price)
		if hi-lo < 0.15 {
			hi = lo + 0.15
		}
		shapes = append(shapes,
			ln.NewCube(ln.Vector{x - 0.35, -0.35, lo}, ln.Vector{x + 0.35, 0.35, hi}),
			ln.NewCube(ln.Vector{x - 0.04, -0.04, lo - 0.3 - rng.Float64()*0.3},
				ln.Vector{x + 0.04, 0.04, hi + 0.3 + rng.Float64()*0.3}),
		)
		trend = append(trend, ln.Vector{x, -0.6, price})
	}
	// Reverse so the line's path direction runs right → left.
	for i, j := 0, len(trend)-1; i < j; i, j = i+1, j-1 {
		trend[i], trend[j] = trend[j], trend[i]
	}

	occluders := make([]ln.Shape, len(shapes))
	for i, s := range shapes {
		occluders[i] = occluder{s}
	}
	return fit(map[string]ln.Paths{
		"candles": cam.render(shapes...),
		"trend":   cam.render(append(occluders, &pathShape{trend})...),
	}, 8)
}

// ledger: an expense sheet seen in perspective. The amount column rises as
// bars, and a running tally runs over their tops down to the total.
func ledger() Art {
	cam := camera{
		eye:    ln.Vector{-7, -9, 8},
		center: ln.Vector{0.6, 0, 0.5},
		up:     ln.Vector{0, 0, 1},
		w:      800, h: 560, fovy: 32,
	}
	const rows, cols = 6, 4
	const cw, rh = 1.4, 0.8 // cell width (x), row height (y)
	x0, y0 := -cw*cols/2, -rh*rows/2

	var sheet ln.Paths
	for r := 0; r <= rows; r++ {
		y := y0 + float64(r)*rh
		sheet = append(sheet, ln.Path{{x0, y, 0}, {-x0, y, 0}})
	}
	for c := 0; c <= cols; c++ {
		x := x0 + float64(c)*cw
		sheet = append(sheet, ln.Path{{x, y0, 0}, {x, -y0, 0}})
	}
	// short "text" strokes in the description cells
	rng := rand.New(rand.NewSource(3))
	for r := 1; r < rows; r++ {
		y := y0 + (float64(r)+0.5)*rh
		for c := 0; c < cols-1; c++ {
			x := x0 + float64(c)*cw + 0.2
			sheet = append(sheet, ln.Path{{x, y, 0}, {x + 0.4 + rng.Float64()*0.6, y, 0}})
		}
	}

	// bars in the last column, one per row; row 0 (nearest) holds the total
	var bars []ln.Shape
	var tally ln.Path
	bx := x0 + float64(cols-1)*cw + cw/2
	for r := rows - 1; r >= 1; r-- {
		y := y0 + (float64(r)+0.5)*rh
		h := 0.3 + rng.Float64()*1.1
		bars = append(bars, ln.NewCube(ln.Vector{bx - 0.35, y - 0.25, 0}, ln.Vector{bx + 0.35, y + 0.25, h}))
		tally = append(tally, ln.Vector{bx, y, h + 0.12})
	}
	ty := y0 + 0.5*rh
	tally = append(tally, ln.Vector{bx, ty, 0.6}, ln.Vector{bx, ty, 0.02})
	// accountant's double rule under the total
	for _, dy := range []float64{-0.18, -0.26} {
		sheet = append(sheet, ln.Path{{bx - 0.45, ty + dy, 0}, {bx + 0.45, ty + dy, 0}})
	}

	shapes := make([]ln.Shape, 0, len(sheet))
	for _, p := range sheet {
		shapes = append(shapes, &pathShape{p})
	}
	occ := make([]ln.Shape, len(bars))
	for i, b := range bars {
		occ[i] = occluder{b}
	}
	return fit(map[string]ln.Paths{
		"sheet": cam.render(append(occ, shapes...)...),
		"bars":  cam.render(bars...),
		"tally": cam.render(append(occ, &pathShape{tally})...),
	}, 8)
}

// network: payment nodes in space joined to their nearest neighbours, with
// one authorisation route (card → acquirer → network → issuer) picked out.
func network() Art {
	cam := camera{
		eye:    ln.Vector{7, -8, 4},
		center: ln.Vector{},
		up:     ln.Vector{0, 0, 1},
		w:      700, h: 600, fovy: 34,
	}
	rng := rand.New(rand.NewSource(11))
	const n, r = 16, 0.16
	pts := make([]ln.Vector, 0, n)
	for len(pts) < n {
		v := ln.Vector{rng.Float64()*6 - 3, rng.Float64()*6 - 3, rng.Float64()*3 - 1.5}
		ok := true
		for _, p := range pts {
			if p.Sub(v).Length() < 1.3 {
				ok = false
				break
			}
		}
		if ok {
			pts = append(pts, v)
		}
	}

	// route: walk from the left-most node, always to the nearest unvisited
	// node to the right, for four hops
	start := 0
	for i, p := range pts {
		if p.X < pts[start].X {
			start = i
		}
	}
	route := []int{start}
	for len(route) < 5 {
		cur, best := pts[route[len(route)-1]], -1
		for i, p := range pts {
			if p.X > cur.X && (best < 0 || p.Sub(cur).Length() < pts[best].Sub(cur).Length()) {
				best = i
			}
		}
		if best < 0 {
			break
		}
		route = append(route, best)
	}
	onRoute := map[[2]int]bool{}
	for i := 1; i < len(route); i++ {
		a, b := route[i-1], route[i]
		onRoute[[2]int{a, b}], onRoute[[2]int{b, a}] = true, true
	}

	// links: each node to its three nearest neighbours, deduplicated
	seen := map[[2]int]bool{}
	var links []ln.Shape
	for i, p := range pts {
		idx := make([]int, 0, n-1)
		for j := range pts {
			if j != i {
				idx = append(idx, j)
			}
		}
		for k := 0; k < 3; k++ {
			m := k
			for t := k + 1; t < len(idx); t++ {
				if pts[idx[t]].Sub(p).Length() < pts[idx[m]].Sub(p).Length() {
					m = t
				}
			}
			idx[k], idx[m] = idx[m], idx[k]
			j := idx[k]
			key := [2]int{min(i, j), max(i, j)}
			if seen[key] || onRoute[key] {
				continue
			}
			seen[key] = true
			links = append(links, &pathShape{ln.Path{p, pts[j]}})
		}
	}
	var path ln.Path
	for _, i := range route {
		path = append(path, pts[i])
	}

	nodes := make([]ln.Shape, n)
	occ := make([]ln.Shape, n)
	for i, p := range pts {
		nodes[i] = ln.NewOutlineSphere(cam.eye, cam.up, p, r)
		occ[i] = occluder{ln.NewSphere(p, r)}
	}
	return fit(map[string]ln.Paths{
		"nodes": cam.render(nodes...),
		"links": cam.render(append(occ, links...)...),
		"route": cam.render(append(occ, &pathShape{path})...),
	}, 8)
}

// gittree: a commit graph laid along x. Feature branches peel off main,
// rise and merge back; main itself is the line drawn on scroll.
func gittree() Art {
	cam := camera{
		eye:    ln.Vector{0, -11, 4.5},
		center: ln.Vector{0, 0, 0.5},
		up:     ln.Vector{0, 0, 1},
		w:      800, h: 420, fovy: 30,
	}
	const step, r = 0.9, 0.13
	const commits = 11
	at := func(i float64) float64 { return (i - (commits-1)/2.0) * step }

	var main ln.Path
	var dots []ln.Vector
	for i := 0; i < commits; i++ {
		main = append(main, ln.Vector{at(float64(i)), 0, 0})
		dots = append(dots, main[i])
	}

	// branches: {from, to, lift in y, lift in z}
	type branch struct {
		from, to int
		dy, dz   float64
	}
	var branches ln.Paths
	for _, b := range []branch{{1, 4, 1.3, 0.9}, {3, 7, -1.1, 1.4}, {6, 9, 1.0, 0.7}} {
		var p ln.Path
		const seg = 40
		for s := 0; s <= seg; s++ {
			t := float64(s) / seg
			// ease out of main, run parallel, ease back in
			lift := math.Sin(math.Pi * t)
			lift = math.Min(1, lift*1.6)
			x := at(float64(b.from)) + t*(at(float64(b.to))-at(float64(b.from)))
			p = append(p, ln.Vector{x, b.dy * lift, b.dz * lift})
		}
		branches = append(branches, p)
		for c := 1; c < b.to-b.from; c++ {
			s := c * seg / (b.to - b.from)
			dots = append(dots, p[s])
		}
	}

	commitsShapes := make([]ln.Shape, len(dots))
	occ := make([]ln.Shape, len(dots))
	for i, d := range dots {
		commitsShapes[i] = ln.NewOutlineSphere(cam.eye, cam.up, d, r)
		occ[i] = occluder{ln.NewSphere(d, r)}
	}
	bshapes := make([]ln.Shape, len(branches))
	for i, p := range branches {
		bshapes[i] = &pathShape{p}
	}
	return fit(map[string]ln.Paths{
		"commits":  cam.render(commitsShapes...),
		"branches": cam.render(append(occ, bshapes...)...),
		"main":     cam.render(append(occ, &pathShape{main})...),
	}, 8)
}

// ---------- output ----------

func writeSVG(dir, name string, a Art) error {
	var b strings.Builder
	fmt.Fprintf(&b, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f" fill="none" stroke="#1d2b3a" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">`, a.W, a.H)
	for _, d := range a.Layers {
		fmt.Fprintf(&b, `<path d="%s"/>`, d)
	}
	b.WriteString("</svg>")
	return os.WriteFile(filepath.Join(dir, name+".svg"), []byte(b.String()), 0o644)
}

func main() {
	out := filepath.Join("..", "site", "art")
	if err := os.MkdirAll(out, 0o755); err != nil {
		panic(err)
	}
	art := map[string]Art{
		"globe":   globe(),
		"candles": candles(),
		"ledger":  ledger(),
		"network": network(),
		"gittree": gittree(),
	}
	for name, a := range art {
		if err := writeSVG(out, name, a); err != nil {
			panic(err)
		}
	}
	data, _ := json.Marshal(art)
	js := "// Generated by generator/main.go. Do not edit by hand.\nwindow.LN_ART = " + string(data) + ";\n"
	if err := os.WriteFile(filepath.Join(out, "art.js"), []byte(js), 0o644); err != nil {
		panic(err)
	}
	fmt.Println("wrote", out)
}
