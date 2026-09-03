import { api } from "./api.js";
import { $, esc, $$ } from "./core.js";
let timer,
  idx = 0;
export async function initLanding() {
  const slides = $$(".landing-slide");
  if (slides.length) {
    const rotate = () => {
      slides.forEach((s, i) => s.classList.toggle("active", i === idx));
      idx = (idx + 1) % slides.length;
    };
    rotate();
    timer = setInterval(rotate, 7000);
  }
  const box = $("#landingGames");
  if (!box) return;
  try {
    const p = await api("/games?ordering=-added&page_size=10");
    const games = (p.results || []).slice(0, 10);
    if (games.length)
      box.innerHTML = games
        .map(
          (g) =>
            `<div class="landing-slide preload" style="display:none" data-title="${esc(g.name)}"></div>`,
        )
        .join("");
  } catch {}
}
export function stopLanding() {
  clearInterval(timer);
}
