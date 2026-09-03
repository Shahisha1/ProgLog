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
  )}${g.released ? ` · ${esc(g.released)}` : ""}</p><small>${g.rating ? `${Number(g.rating).toFixed(1)} rating` : "No rating"}${g.metacritic ? ` · Metacritic ${g.metacritic}` : ""}</small></div><button class="btn btn-primary import-game" data-index="${i}" type="button">Add</button></article>`;
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
function parseCSV(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i],
      n = text[i + 1];
    if (c === '"') {
      if (quoted && n === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && n === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows
    .shift()
    .map((x) => x.toLowerCase().replace(/[^a-z]/g, ""));
  return rows
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])))
    .filter((x) => x.game || x.name);
}
async function importCSV(file) {
  if (!file) return showToast("Choose a CSV file first.", "error");
  try {
    const rows = parseCSV(await file.text());
    if (!rows.length) throw new Error("No game rows were found.");
    let added = 0;
    for (const r of rows) {
      const name = String(r.game || r.name || "").trim();
      if (!name) continue;
      const existing = library.find(
        (g) => g.name?.toLowerCase() === name.toLowerCase(),
      );
      const game = existing || {
        id: `manual-${Date.now()}-${added}`,
        rawgId: null,
        name,
        coverUrl: "",
        backgroundUrl: "",
        genres: [],
      };
      game.status = String(r.status || game.status || "backlog").toLowerCase();
      if (
        !["playing", "backlog", "completed", "dropped", "wishlist"].includes(
          game.status,
        )
      )
        game.status = "backlog";
      if (r.playtime !== undefined && r.playtime !== "")
        game.playtimeHours = Math.max(0, Number(r.playtime) || 0);
      if (r.rating !== undefined && r.rating !== "")
        game.personalRating = Math.min(5, Math.max(1, Number(r.rating) || 0));
      if (r.review !== undefined) game.review = String(r.review);
      await saveGame(game);
      await addActivity(
        "library_import",
        `Imported ${name} into your library`,
        { gameId: game.id },
      );
      added++;
    }
    library = await listGames();
    renderGameCards(library, $("#library"));
    showToast(`${added} game${added === 1 ? "" : "s"} imported successfully.`);
  } catch (e) {
    showToast(e.message || "CSV import failed.", "error");
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
  $("#csvImportForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await importCSV($("#csvFile")?.files?.[0]);
  });
  $("#downloadCsvTemplate")?.addEventListener("click", () => {
    const blob = new Blob(
      [
        'Game,Status,Playtime,Rating,Review\nElden Ring,playing,94,5,"My notes"\n',
      ],
      { type: "text/csv" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "proglog-library-template.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  window.lucide?.createIcons();
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
          `<a class="game-tile" href="./game.html?rawgId=${g.id}&name=${encodeURIComponent(g.name)}"><img src="${esc(g.background_image || "")}" alt="${esc(g.name)} artwork" loading="lazy"><div class="game-copy"><strong>${esc(g.name)}</strong><small>${g.rating ? `${Number(g.rating).toFixed(1)} rating` : "No rating"}${g.released ? ` · ${esc(g.released.slice(0, 4))}` : ""}</small></div></a>`,
      )
      .join("");
  } catch (e) {
    box.innerHTML = `<div class="api-state error-state">${esc(e.message)}</div>`;
  }
}
