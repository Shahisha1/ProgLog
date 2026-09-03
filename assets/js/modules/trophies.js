import { listGames } from "./store.js";
import { $, esc } from "./core.js";
export async function initTrophies() {
  const gs = await listGames();
  const ach = gs.flatMap((g) => g.achievements || []);
  const u = ach.filter((a) => a.unlocked).length,
    total = ach.length;
  const pct = total ? Math.round((u / total) * 100) : 0;
  const tiers = [
    ["Bronze", "25%", 25],
    ["Silver", "50%", 50],
    ["Gold", "75%", 75],
    ["Platinum", "100%", 100],
  ];
  $("#achievementGroups").innerHTML = tiers
    .map(
      ([n, t, p], i) =>
        `<article class="feature"><div class="eyebrow">${esc(n)} trophy</div><h3>${t} completion</h3><p>${pct >= p ? `Unlocked — your achievement completion is ${pct}%.` : `Locked — reach ${p}% achievement completion. Current: ${pct}%.`}</p></article>`,
    )
    .join("");
}
