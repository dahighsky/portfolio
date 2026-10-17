import { buildScene } from "./scene.js";
import { frameAt } from "./morph.js";
import { buildStops, progressAt } from "./scroll.js";
import { Stage } from "./render.js";
import { SCENES } from "./scenes/index.js";
import { DESTINATION } from "./config.js";
import { Words } from "./words.js";

for (const el of document.querySelectorAll("[data-copy]")) {
  const key = el.dataset.copy, text = key === "name" ? DESTINATION.name : DESTINATION.copy[key];
  if (text) el.textContent = text;
}

// One drawing for every screen, always edge to edge. Phones show the 400×860
// scene as drawn; wider screens widen the canvas to the window's shape and draw
// extra scenery in the margins. On wide screens the scene sits right of centre
// because the text card moves to the left.
const svg = document.querySelector("#stage svg");
const wideMQ = matchMedia("(min-width: 900px) and (min-aspect-ratio: 1/1)");
const stage = new Stage(svg);
const built = {};
let scenes, view, words;
function useLayout() {
  // Widen the canvas to the window's shape whenever the window is wider than the
  // drawing (tablets, laptops), and fill those margins with each scene's wings.
  const w = Math.max(400, 860 * innerWidth / innerHeight), wings = w > 420;
  const key = wings ? "wings" : "plain";
  built[key] ??= SCENES.map(d => buildScene(d, { wings }));
  scenes = built[key];
  const focus = wideMQ.matches ? 0.6 : 0.5; // wide screens: the card is on the left, so the scene sits right of centre
  view = { x: 200 - focus * w, w };
  svg.setAttribute("viewBox", `${view.x.toFixed(1)} 0 ${w.toFixed(1)} 860`);
  document.body.classList.toggle("words", wideMQ.matches);
  words?.hide();
  stage.cache.clear();
}
useLayout();
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const blocks = [...document.querySelectorAll("section.block[data-stop]")];

// One docked card: move every block's card into it, show the one whose block
// is nearest the middle of the screen, and size the dock to that card.
const dock = document.getElementById("dock");
const cards = blocks.map(b => {
  const c = b.querySelector(".card");
  b.removeAttribute("aria-labelledby");
  dock.append(c);
  return c;
});
// On wide screens the same words are drawn into the scene instead (words.js).
const content = cards.map(c => ({
  eyebrow: c.querySelector(".eyebrow")?.textContent ?? "",
  title: c.querySelector("h1, h2").textContent,
  lede: c.querySelector(":scope > p:not(.eyebrow):not(.credit)")?.innerHTML ?? "",
  items: [...c.querySelectorAll("li")].map(e => ({ html: e.innerHTML })),
}));
words = new Words(svg, "fonts/EMSFelix.svg");

let active = -1;
function showCard(i) {
  if (i !== active) {
    cards[active]?.classList.remove("on");
    cards[i].classList.add("on");
    active = i;
  }
  dock.style.setProperty("--dock-h", cards[i].offsetHeight + "px");
}

let stops = [], shown = -1, raf = 0;

function measure() {
  stops = buildStops(blocks.map(b => {
    const r = b.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height, stop: +b.dataset.stop };
  }), innerHeight);
  shown = -1;
  update();
}

function update() {
  let near = 0;
  stops.forEach((s, i) => { if (Math.abs(s.y - scrollY) < Math.abs(stops[near].y - scrollY)) near = i; });
  if (cards.length) showCard(near);
  const p = progressAt(scrollY, stops, scenes.length);
  if (wideMQ.matches && cards.length) {
    // write the words only while the scene is at rest; clear them as it starts to change
    if (Number.isInteger(p)) words.show(near, content[near], scenes[p].bullet, view, reduce.matches);
    else words.hide();
  }
  if (!reduce.matches) { stage.draw(frameAt(scenes, p)); return; }
  // reduced motion: no morphing, just the nearest finished scene with a soft fade
  const k = Math.round(p);
  if (k === shown) return;
  if (shown < 0) { stage.draw(frameAt(scenes, k)); shown = k; return; }
  shown = k;
  svg.style.opacity = 0;
  setTimeout(() => { stage.draw(frameAt(scenes, shown)); svg.style.opacity = 1; }, 150);
}

const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
addEventListener("scroll", schedule, { passive: true });
addEventListener("resize", () => { useLayout(); measure(); });
new ResizeObserver(measure).observe(document.querySelector("main"));
document.fonts?.ready.then(measure);
reduce.addEventListener("change", () => { shown = -1; svg.style.opacity = 1; update(); });
wideMQ.addEventListener("change", () => { useLayout(); measure(); });
measure();
