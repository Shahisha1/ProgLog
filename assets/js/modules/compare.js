import { listGames } from "./store.js";
import { $, esc, fmtHours } from "./core.js";
export async function initCompare() {
  const gs = await listGames(),
    a = $("#compareA"),
    b = $("#compareB");
  const opt =
    '<option value="">Choose a game</option>' +
    gs
      .map((g) => `<option value="${esc(g.id)}">${esc(g.name)}</option>`)
      .join("");
  if (a) {
    a.innerHTML = opt;
    b.innerHTML = opt;
  }
  function render() {
    const ga = gs.find((g) => g.id === a.value),
      gb = gs.find((g) => g.id === b.value),
      box = $("#compareCards");
    if (!ga && !gb) {
      box.innerHTML = '<div class="empty">Choose two games to compare.</div>';
      return;
    }
    const card = (g) =>
      g
        ? `<article class="card pad compare-card"><img src="${esc(g.coverUrl || "")}" alt="${esc(g.name)} cover"><h3>${esc(g.name)}</h3><div class="metric"><span>Status</span><span>${esc(g.status || "Backlog")}</span></div><div class="metric"><span>Playtime</span><span>${fmtHours(g.playtimeHours || 0)}</span></div><div class="metric"><span>Rating</span><span>${g.rating ? Number(g.rating).toFixed(1) : "—"}</span></div><div class="metric"><span>Achievements</span><span>${g.achievements?.filter((a) => a.unlocked).length || 0}/${g.achievements?.length || 0}</span></div><div class="metric"><span>Genres</span><span>${esc(
            (g.genres || [])
              .slice(0, 2)
              .map((x) => x.name || x)
              .join(", ") || "—",
          )}</span></div></article>`
        : '<div class="card pad empty">Not selected.</div>';
    box.innerHTML = card(ga) + card(gb);
  }
  a?.addEventListener("change", render);
  b?.addEventListener("change", render);
  render();
}
