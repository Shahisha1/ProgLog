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
    game = { ...game, ...rawgToGame(d), id: game.id || `rawg-${game.rawgId}` };
    try {
      const ad = await api(`/games/${game.rawgId}/achievements?page_size=100`);
      game.achievements = (ad.results || []).map((a) => ({
        id: a.id,
        name: a.name,
        displayName: a.name,
        description: a.description || "",
        image: a.image || "",
        percent: a.percent ?? null,
        unlocked: Boolean(a.unlocked),
      }));
    } catch {
      game.achievements = game.achievements || [];
    }
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
    document.querySelector("#favoriteGame").innerHTML = game.favorite
      ? '<i data-lucide="heart"></i> Favorited'
      : '<i data-lucide="heart"></i> Favorite';
    window.lucide?.createIcons();
    showToast(
      game.favorite ? "Added to favorites." : "Removed from favorites.",
    );
  });
  const setupStars = (value = 0) => {
    const box = $("#starRating");
    if (!box) return;
    const current = Number(value) || 0;
    box.innerHTML = [1, 2, 3, 4, 5]
      .map(
        (n) =>
          `<button type="button" class="star ${n <= current ? "is-active" : ""}" data-rating="${n}" aria-label="${n} star${n > 1 ? "s" : ""}" aria-pressed="${n === current ? "true" : "false"}"><i data-lucide="star"></i></button>`,
      )
      .join("");
    box.querySelectorAll(".star").forEach((b) => {
      b.addEventListener("mouseenter", () =>
        box
          .querySelectorAll(".star")
          .forEach((x) =>
            x.classList.toggle(
              "is-hover",
              Number(x.dataset.rating) <= Number(b.dataset.rating),
            ),
          ),
      );
      b.addEventListener("mouseleave", () =>
        box
          .querySelectorAll(".star")
          .forEach((x) => x.classList.remove("is-hover")),
      );
      b.addEventListener("focus", () =>
        box
          .querySelectorAll(".star")
          .forEach((x) =>
            x.classList.toggle(
              "is-hover",
              Number(x.dataset.rating) <= Number(b.dataset.rating),
            ),
          ),
      );
      b.addEventListener("blur", () =>
        box
          .querySelectorAll(".star")
          .forEach((x) => x.classList.remove("is-hover")),
      );
      b.addEventListener("click", () => {
        const r = Number(b.dataset.rating);
        $("#personalRating").value = r;
        $("#ratingHint").textContent =
          `${r}/5 — ${["", "Not for me", "It was okay", "Worth playing", "Really good", "Loved it"][r]}`;
        box.querySelectorAll(".star").forEach((x) => {
          const on = Number(x.dataset.rating) <= r;
          x.classList.toggle("is-active", on);
          x.setAttribute(
            "aria-pressed",
            String(Number(x.dataset.rating) === r),
          );
        });
      });
    });
    window.lucide?.createIcons();
  };
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
    `<strong>${g.rating ? Number(g.rating).toFixed(1) : "—"}</strong> <span class="positive">RAWG</span>${g.metacritic ? ` · Metacritic ${g.metacritic}` : ""}`;
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
  $("#favoriteGame").innerHTML = g.favorite
    ? '<i data-lucide="heart"></i> Favorited'
    : '<i data-lucide="heart"></i> Favorite';
  $("#personalRating").value = g.personalRating || "";
  $("#personalReview").value = g.review || "";
  setupStars(g.personalRating || 0);
  $("#playtime").textContent = fmtHours(g.playtimeHours || 0);
  const ach = g.achievements || [];
  $("#achievementCount").textContent =
    `${ach.filter((a) => a.unlocked).length}/${ach.length || 0}`;
  $("#gameAchievements").innerHTML = ach.length
    ? ach
        .slice(0, 12)
        .map(
          (a) =>
            `<div class="achievement ${a.unlocked ? "" : "locked"}"><img src="${esc(a.image || "../assets/images/achievement-placeholder.svg")}" alt="" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/achievement-placeholder.svg'"><div><strong>${esc(a.name || a.displayName || "Achievement")}</strong><small>${esc(a.description || "")}</small></div><span class="check">${a.unlocked ? '<i data-lucide="check"></i>' : ""}</span></div>`,
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
  window.lucide?.createIcons();
}
