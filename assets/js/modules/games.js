import { api, rawgToGame } from "./api.js";
import { listGames, saveGame, deleteGame, addActivity } from "./store.js";
import { $, $$, esc, showToast } from "./core.js";
import { renderGameCards } from "./ui.js";
let searchResults = [];
let library = [];
function resultHTML(g, i) {
  return `<article class="result"><img src="${esc(g.background_image || "")}" alt="${esc(g.name)} cover" loading="lazy"><div><h3>${esc(g.name)}</h3><p>${esc(
    (g.platforms || [])
      .slice(0, 4)
      .map((x) => x.platform?.name || x.name || x)
      .join(" · ") || "Platforms unavailable",
  )}${g.released ? ` · ${esc(g.released)}` : ""}</p><small>${g.rating ? `★ ${Number(g.rating).toFixed(1)}` : "No rating"}${g.metacritic ? ` · Metacritic ${g.metacritic}` : ""}</small></div><button class="btn btn-primary import-game" data-index="${i}" type="button">Add</button></article>`;
}
async function search(q) {
  const box = $("#gameSearchResults");
  if (!box) return;
  if (q.length < 2) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = '<div class="api-state">Searching RAWG…</div>';
  try {
    const d = await api(`/games?search=${encodeURIComponent(q)}&page_size=12`);
    searchResults = d.results || [];
    box.innerHTML = searchResults.length
      ? searchResults.map(resultHTML).join("")
      : '<div class="api-state">No games found.</div>';
  } catch (e) {
    box.innerHTML = `<div class="api-state error-state">${esc(e.message)}</div>`;
  }
}
async function add(index) {
  const raw = searchResults[index];
  if (!raw) return;
  const btn = $$(".import-game")[index];
  btn && ((btn.disabled = true), (btn.textContent = "Adding…"));
  try {
    const detail = await api(`/games/${raw.id}`);
    const game = rawgToGame({ ...raw, ...detail });
    game.status = "backlog";
    game.id = `rawg-${game.rawgId}`;
    game.steamAppId =
      (detail.stores || [])
        .find((s) => String(s.store?.slug).includes("steam"))
        ?.url?.match(/app\/([0-9]+)/)?.[1] || null;
    await saveGame(game);
    await addActivity("game_added", `Added ${game.name} to your library`, {
      gameId: game.id,
    });
    showToast(`${game.name} was added.`);
    library = await listGames();
    renderGameCards(library, $("#library"));
    if (btn) {
      btn.textContent = "Added ✓";
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "Add";
      }, 900);
    }
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Add";
    }
    showToast(e.message, "error");
  }
}
export async function initGames() {
  library = await listGames();
  renderGameCards(library, $("#library"));
  const form = $("#gameSearchForm"),
    input = $("#gameSearchInput");
  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    input.value = q;
    search(q);
  }
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    search(input.value.trim());
  });
  let to;
  input?.addEventListener("input", () => {
    clearTimeout(to);
    to = setTimeout(() => search(input.value.trim()), 280);
  });
  $("#gameSearchResults")?.addEventListener("click", (e) => {
    const b = e.target.closest(".import-game");
    if (b) add(Number(b.dataset.index));
  });
  $("#libraryFilter")?.addEventListener("change", (e) =>
    renderGameCards(
      library.filter(
        (g) => e.target.value === "all" || g.status === e.target.value,
      ),
      $("#library"),
    ),
  );
  $("#clearGames")?.addEventListener("click", async () => {
    if (!confirm("Remove every saved game from this device/account?")) return;
    for (const g of library) await deleteGame(g.id);
    library = [];
    renderGameCards([], $("#library"));
    showToast("Library cleared.");
  });
}
export async function loadDiscoverCarousel() {
  const box = $("#discoverGames");
  if (!box) return;
  try {
    const p = await api("/games?ordering=-added&page_size=14");
    const games = p.results || [];
    box.innerHTML = games
      .map(
        (g) =>
          `<a class="game-tile" href="./game.html?rawgId=${g.id}&name=${encodeURIComponent(g.name)}"><img src="${esc(g.background_image || "")}" alt="${esc(g.name)} artwork" loading="lazy"><div class="game-copy"><strong>${esc(g.name)}</strong><small>${g.rating ? `★ ${Number(g.rating).toFixed(1)}` : "No rating"}${g.released ? ` · ${esc(g.released.slice(0, 4))}` : ""}</small></div></a>`,
      )
      .join("");
  } catch (e) {
    box.innerHTML = `<div class="api-state error-state">${esc(e.message)}</div>`;
  }
}
