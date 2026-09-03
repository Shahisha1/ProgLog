import { api } from "./api.js";
import {
  listGames,
  saveGame,
  saveAchievementSummary,
  addActivity,
} from "./store.js";
import { auth } from "./firebase.js";
import { $, esc, showToast } from "./core.js";
export async function initSteam() {
  const form = $("#steamForm"),
    out = $("#steamResult");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#steamInput").value.trim();
    if (!input) return showToast("Enter a SteamID64 or vanity name.", "error");
    out.textContent = "Loading Steam…";
    try {
      let steamid = input;
      if (!/^\d{17}$/.test(steamid)) {
        const r = await api(
          `/steam/resolve?vanity=${encodeURIComponent(input)}`,
        );
        if (!r.response?.success || !r.response.steamid)
          throw new Error("Steam vanity name could not be resolved.");
        steamid = r.response.steamid;
      }
      const [profile, owned, recent] = await Promise.all([
        api(`/steam/player?steamid=${steamid}`),
        api(`/steam/owned?steamid=${steamid}`),
        api(`/steam/recent?steamid=${steamid}`),
      ]);
      const p = profile.response?.players?.[0];
      const games = owned.response?.games || [];
      const rg = recent.response?.games || [];
      out.innerHTML = `<div class="split"><div><h2>${esc(p?.personaname || "Steam user")}</h2><p class="muted">${games.length} owned games · ${rg.length} recent games</p></div><img class="avatar" src="${esc(p?.avatarfull || "")}" alt="Steam avatar"></div><div class="form-actions" style="margin-top:14px"><button id="syncOwned" class="btn btn-primary" type="button">Sync owned games</button><button id="syncRecent" class="btn" type="button">Sync recent playtime</button><button id="syncAchievements" class="btn" type="button">Sync Steam achievements</button></div>`;
      document
        .querySelector("#syncOwned")
        ?.addEventListener("click", async () => {
          const local = await listGames();
          const byName = new Map(local.map((g) => [g.name.toLowerCase(), g]));
          let matched = 0;
          for (const sg of games) {
            const g = byName.get(String(sg.name || "").toLowerCase());
            if (g) {
              g.steamAppId = sg.appid;
              g.playtimeHours = (Number(sg.playtime_forever) || 0) / 60;
              await saveGame(g);
              matched++;
            }
          }
          await addActivity(
            "steam_sync",
            `Synced Steam library: ${matched} progLog games matched`,
            {},
          );
          showToast(`Steam sync complete. ${matched} games matched.`);
        });
      document
        .querySelector("#syncRecent")
        ?.addEventListener("click", async () => {
          const local = await listGames();
          let matched = 0;
          for (const sg of rg) {
            const g = local.find(
              (x) =>
                x.name?.toLowerCase() === String(sg.name || "").toLowerCase(),
            );
            if (g) {
              g.steamAppId = sg.appid;
              g.playtimeHours = Math.max(
                Number(g.playtimeHours) || 0,
                (Number(sg.playtime_forever) || 0) / 60,
              );
              await saveGame(g);
              matched++;
            }
          }
          showToast(`Recent Steam playtime updated for ${matched} games.`);
        });
      document
        .querySelector("#syncAchievements")
        ?.addEventListener("click", async () => {
          const local = await listGames();
          let matched = 0,
            updated = 0;
          for (const g of local) {
            if (!g.steamAppId) continue;
            try {
              const [schema, player] = await Promise.all([
                api(`/steam/schema?appid=${encodeURIComponent(g.steamAppId)}`),
                api(
                  `/steam/achievements?steamid=${steamid}&appid=${encodeURIComponent(g.steamAppId)}`,
                ),
              ]);
              const schemaMap = new Map(
                (schema.game?.availableGameStats?.achievements || []).map(
                  (a) => [a.name, a],
                ),
              );
              const ach = (player.playerstats?.achievements || []).map((a) => {
                const meta = schemaMap.get(a.apiname) || {};
                return {
                  id: a.apiname,
                  name: meta.displayName || a.apiname,
                  description: meta.description || "",
                  image: meta.icon || meta.icongray || "",
                  unlocked: a.achieved === 1,
                  unlockTime: a.unlocktime
                    ? new Date(a.unlocktime * 1000).toISOString()
                    : null,
                  source: "Steam",
                };
              });
              if (ach.length) {
                g.achievements = ach;
                await saveGame(g);
                await saveAchievementSummary(g.id, ach);
                updated++;
              }
              matched++;
            } catch (e) {
              console.warn(`achievement sync failed for ${g.name}`, e);
            }
          }
          await addActivity(
            "steam_achievements",
            `Synced Steam achievements for ${updated} games`,
            {},
          );
          showToast(
            `Achievement sync finished. ${updated} games updated out of ${matched} with Steam IDs.`,
          );
        });
      if (auth?.currentUser && p)
        await addActivity(
          "steam_connect",
          `Connected Steam profile ${p.personaname}`,
          {},
        );
    } catch (err) {
      out.innerHTML = `<p class="error-state">${esc(err.message)}</p>`;
    }
  });
}
