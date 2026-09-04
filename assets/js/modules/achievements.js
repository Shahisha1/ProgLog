import { listGames, saveGame } from "./store.js";
import { api } from "./api.js";
import { $, esc } from "./core.js";
export async function initAchievements() {
  const games = await listGames();
  for (const g of games) {
    if (!g.rawgId) continue;
    const missing = (g.achievements || []).some((a) => !a.image);
    if (!missing) continue;
    try {
      const d = await api(`/games/${g.rawgId}/achievements?page_size=100`);
      if (d.results?.length) {
        g.achievements = d.results.map((a) => ({
          id: a.id,
          name: a.name,
          displayName: a.name,
          description: a.description || "",
          image: a.image || "",
          percent: a.percent ?? null,
          unlocked: Boolean(
            (g.achievements || []).find((x) => x.id === a.id)?.unlocked,
          ),
        }));
        await saveGame(g);
      }
    } catch (e) {
      console.warn("Achievement image refresh failed", e);
    }
  }
  const fresh = await listGames();
  const box = $("#achievementGroups");
  if (!box) return;
  const all = [];
  fresh.forEach((g) =>
    (g.achievements || []).forEach((a) =>
      all.push({ ...a, gameName: g.name, gameId: g.id }),
    ),
  );
  const unlocked = all.filter((a) => a.unlocked).length;
  if ($("#achTotal")) $("#achTotal").textContent = all.length;
  if ($("#achUnlocked")) $("#achUnlocked").textContent = unlocked;
  if ($("#achRate"))
    $("#achRate").textContent = all.length
      ? `${Math.round((unlocked / all.length) * 100)}%`
      : "0%";
  box.innerHTML = all.length
    ? all
        .map(
          (a) =>
            `<div class="achievement ${a.unlocked ? "" : "locked"}"><img src="${esc(a.image || "../assets/images/achievement-placeholder.svg")}" alt="" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/achievement-placeholder.svg'"><div><strong>${esc(a.name || a.displayName || "Achievement")}</strong><small>${esc(a.gameName)} · ${esc(a.description || "")}</small></div><span class="check">${a.unlocked ? '<i data-lucide="check"></i>' : ""}</span></div>`,
        )
        .join("")
    : '<div class="empty">Add games with achievement data to start your collection.</div>';
  window.lucide?.createIcons();
}
