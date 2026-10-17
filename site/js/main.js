import { buildScene } from "./scene.js";
import { frameAt } from "./morph.js";
import { buildStops, progressAt } from "./scroll.js";
import { Stage } from "./render.js";
import { SCENES } from "./scenes/index.js";
import { DESTINATION } from "./config.js";

for (const el of document.querySelectorAll("[data-copy]")) {
  const key = el.dataset.copy, text = key === "name" ? DESTINATION.name : DESTINATION.copy[key];
  if (text) el.textContent = text;
}

const scenes = SCENES.map(buildScene);
const svg = document.querySelector("#stage svg");
const stage = new Stage(svg);
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
addEventListener("resize", measure);
new ResizeObserver(measure).observe(document.querySelector("main"));
document.fonts?.ready.then(measure);
reduce.addEventListener("change", () => { shown = -1; svg.style.opacity = 1; update(); });
measure();
