import { listGames, saveGame, saveAchievementSummary } from "./store.js";
import { $, esc, showToast } from "./core.js";
export async function initAchievements() {
  const games = await listGames();
  const box = $("#achievementGroups");
  if (!box) return;
  const all = [];
  games.forEach((g) =>
    (g.achievements || []).forEach((a) =>
      all.push({ ...a, gameName: g.name, gameId: g.id }),
    ),
  );
  const unlocked = all.filter((a) => a.unlocked).length;
  $("#achTotal") && ($("#achTotal").textContent = all.length);
  $("#achUnlocked") && ($("#achUnlocked").textContent = unlocked);
  $("#achRate") &&
    ($("#achRate").textContent = all.length
      ? `${Math.round((unlocked / all.length) * 100)}%`
      : "0%");
  box.innerHTML = all.length
    ? all
        .map(
          (a) =>
            `<div class="achievement ${a.unlocked ? "" : "locked"}"><img src="${esc(a.image || "")}" alt="" loading="lazy"><div><strong>${esc(a.name || a.displayName || "Achievement")}</strong><small>${esc(a.gameName)} · ${esc(a.description || "")}</small></div><span class="check">${a.unlocked ? "✓" : ""}</span></div>`,
        )
        .join("")
    : '<div class="empty">Import games with achievement data or connect Steam to populate this page.</div>';
}
