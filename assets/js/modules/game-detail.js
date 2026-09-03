import { api, rawgToGame } from "./api.js";
import {
  getGame,
  saveGame,
  listSessions,
  saveSession,
  addActivity,
  saveAchievementSummary,
} from "./store.js";
import { $, esc, fmtDate, fmtHours, showToast } from "./core.js";
export async function initGame() {
  const params = new URLSearchParams(location.search);
  let id = params.get("id");
  const rawgId = params.get("rawgId");
  let name = params.get("name") || "";
  let game = null;
  if (id) game = await getGame(id);
  if (!game && rawgId) {
    try {
      const d = await api(`/games/${rawgId}`);
      game = rawgToGame(d);
      game.id = `rawg-${game.rawgId}`;
    } catch {}
  }
  if (!game && name) {
    try {
      const p = await api(
        `/games?search=${encodeURIComponent(name)}&page_size=1`,
      );
      if (p.results?.[0]) {
        const d = await api(`/games/${p.results[0].id}`);
        game = rawgToGame(d);
        game.id = `rawg-${game.rawgId}`;
      }
    } catch {}
  }
  if (!game) {
    $("#gamePage") &&
      ($("#gamePage").innerHTML =
        '<div class="empty">This game could not be loaded. Return to <a class="link" href="games.html">Games</a>.</div>');
    return;
  }
  try {
    const d = await api(`/games/${game.rawgId}`);
    game = {
      ...game,
      ...rawgToGame(d),
      id: game.id || `rawg-${game.rawgId}`,
      achievements: d.achievements || [],
    };
    await saveGame(game);
    render(game);
  } catch {
    render(game);
  }
  $("#saveStatus")?.addEventListener("change", async (e) => {
    game.status = e.target.value;
    await saveGame(game);
    await addActivity("status_change", `${game.name} moved to ${game.status}`, {
      gameId: game.id,
    });
    showToast("Game status updated.");
  });
  $("#favoriteGame")?.addEventListener("click", async () => {
    game.favorite = !game.favorite;
    await saveGame(game);
    document.querySelector("#favoriteGame").textContent = game.favorite
      ? "★ Favorited"
      : "☆ Favorite";
    showToast(
      game.favorite ? "Added to favorites." : "Removed from favorites.",
    );
  });
  $("#reviewForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    game.personalRating = Number($("#personalRating").value) || null;
    game.review = $("#personalReview").value.trim();
    await saveGame(game);
    await addActivity("review", `Reviewed ${game.name}`, { gameId: game.id });
    showToast("Your review was saved.");
  });
  $("#sessionForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date =
      $("#sessionDate").value || new Date().toISOString().slice(0, 16);
    const minutes = Math.max(1, Number($("#sessionDuration").value) || 1);
    await saveSession({
      gameId: game.id,
      gameName: game.name,
      date,
      durationMinutes: minutes,
      note: $("#sessionNote").value.trim(),
    });
    game.playtimeHours = (Number(game.playtimeHours) || 0) + minutes / 60;
    await saveGame(game);
    await addActivity(
      "session",
      `Logged ${fmtHours(minutes / 60)} on ${game.name}`,
      { gameId: game.id },
    );
    $("#sessionNote").value = "";
    showToast("Session logged.");
  });
}
function render(g) {
  document.title = `${g.name} | progLog`;
  $("#gameName").textContent = g.name;
  $("#gameMeta").textContent = `${
    (g.platforms || [])
      .slice(0, 4)
      .map((x) => x.platform?.name || x.name || x)
      .join(" · ") || "Game"
  }${g.released ? ` · ${g.released}` : ""}`;
  $("#gameRating").innerHTML =
    `<strong>★ ${g.rating ? Number(g.rating).toFixed(1) : "—"}</strong> <span class="positive">RAWG</span>${g.metacritic ? ` · Metacritic ${g.metacritic}` : ""}`;
  const cover = $("#gameCover");
  if (cover) {
    cover.src = g.coverUrl || g.heroUrl;
    cover.alt = `${g.name} cover`;
  }
  const art = $("#gameHero");
  if (art && g.heroUrl) art.style.backgroundImage = `url("${g.heroUrl}")`;
  $("#gameDescription").innerHTML = esc(
    g.description || "No description available.",
  ).replace(/\n/g, "<br>");
  $("#saveStatus").value = g.status || "backlog";
  $("#favoriteGame").textContent = g.favorite ? "★ Favorited" : "☆ Favorite";
  $("#personalRating").value = g.personalRating || "";
  $("#personalReview").value = g.review || "";
  $("#playtime").textContent = fmtHours(g.playtimeHours || 0);
  const ach = g.achievements || [];
  $("#achievementCount").textContent =
    `${ach.filter((a) => a.unlocked).length}/${ach.length || 0}`;
  $("#gameAchievements").innerHTML = ach.length
    ? ach
        .slice(0, 12)
        .map(
          (a) =>
            `<div class="achievement ${a.unlocked ? "" : "locked"}"><img src="${esc(a.image || "")}" alt="" loading="lazy"><div><strong>${esc(a.name || a.displayName || "Achievement")}</strong><small>${esc(a.description || "")}</small></div><span class="check">${a.unlocked ? "✓" : ""}</span></div>`,
        )
        .join("")
    : '<div class="api-state">No RAWG achievement data for this game.</div>';
  const shots = (g.shortScreenshots || []).filter((x) => x.image);
  $("#gameScreenshots").innerHTML = shots.length
    ? shots
        .slice(0, 8)
        .map(
          (s) =>
            `<img src="${esc(s.image)}" alt="${esc(g.name)} gameplay screenshot" loading="lazy">`,
        )
        .join("")
    : '<div class="api-state">No screenshots available.</div>';
}
