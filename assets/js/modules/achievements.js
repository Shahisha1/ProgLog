import { listGames, saveGame } from "./store.js";
import { api } from "./api.js";
import { $, esc } from "./core.js";

function mergeAchievements(remote, local = []) {
  const previous = new Map((local || []).map(item => [String(item.id), item]));
  return (remote || []).map(item => {
    const saved = previous.get(String(item.id));
    return {
      id: item.id,
      name: item.name || saved?.name || "Achievement",
      displayName: item.name || saved?.displayName || "Achievement",
      description: item.description || saved?.description || "",
      image: item.image || saved?.image || "",
      percent: item.percent ?? saved?.percent ?? null,
      unlocked: Boolean(saved?.unlocked),
    };
  });
}

function renderAchievementList(games) {
  const box = $("#achievementGroups");
  if (!box) return;

  const all = [];
  games.forEach(game => {
    (game.achievements || []).forEach(achievement => {
      all.push({ ...achievement, gameName: game.name, gameId: game.id });
    });
  });

  const unlocked = all.filter(item => item.unlocked).length;

  if ($("#achTotal")) $("#achTotal").textContent = all.length;
  if ($("#achUnlocked")) $("#achUnlocked").textContent = unlocked;
  if ($("#achRate")) {
    $("#achRate").textContent = all.length
      ? `${Math.round((unlocked / all.length) * 100)}%`
      : "0%";
  }

  box.innerHTML = all.length
    ? all.map(item => `
      <div class="achievement ${item.unlocked ? "" : "locked"}">
        <img
          src="${esc(item.image || "../assets/images/achievement-placeholder.svg")}" 
          alt=""
          loading="lazy"
          decoding="async"
          onerror="this.onerror=null;this.src='../assets/images/achievement-placeholder.svg'"
        >
        <div>
          <strong>${esc(item.name || item.displayName || "Achievement")}</strong>
          <small>${esc(item.gameName)} · ${esc(item.description || "")}</small>
        </div>
        <span class="check">${item.unlocked ? '<i data-lucide="check"></i>' : ""}</span>
      </div>
    `).join("")
    : '<div class="empty">Add games with achievement data to start your collection.</div>';

  window.lucide?.createIcons();
}

export async function initAchievements() {
  const games = await listGames();

  await Promise.all(games.map(async game => {
    if (!game.rawgId) return;

    try {
      const data = await api(`/games/${game.rawgId}/achievements?page_size=100`);
      if (Array.isArray(data.results) && data.results.length) {
        const before = JSON.stringify(game.achievements || []);
        game.achievements = mergeAchievements(data.results, game.achievements);
        if (JSON.stringify(game.achievements) !== before) await saveGame(game);
      }
    } catch (error) {
      console.warn(`Achievement refresh failed for ${game.name}`, error);
    }
  }));

  renderAchievementList(await listGames());
}
