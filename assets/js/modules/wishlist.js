import { listGames, saveGame } from "./store.js";
import { $, esc } from "./core.js";
export async function initWishlist() {
  const games = await listGames();
  const wl = games.filter((g) => g.status === "wishlist");
  $("#wishlist").innerHTML = wl.length
    ? wl
        .map(
          (g) =>
            `<a class="game-card" href="game.html?id=${encodeURIComponent(g.id)}"><img src="${esc(g.coverUrl || "")}" alt="${esc(g.name)} cover" loading="lazy"><strong>${esc(g.name)}</strong><small>${g.released ? `Release: ${esc(g.released)}` : "Release date unknown"}</small></a>`,
        )
        .join("")
    : '<div class="empty">Your wishlist is empty. Add games from Discover and move them here.</div>';
  const upcoming = wl
    .filter((g) => g.released && new Date(g.released) >= new Date())
    .sort((a, b) => new Date(a.released) - new Date(b.released));
  $("#releaseWatch").innerHTML = upcoming.length
    ? upcoming
        .map((g) => {
          const ms = new Date(g.released) - new Date();
          const days = Math.ceil(ms / 86400000);
          return `<div class="activity-item"><strong>${esc(g.name)}</strong><p>${days <= 0 ? "Releases today" : `Releases in ${days} day${days === 1 ? "" : "s"}`}</p><small>${esc(g.released)}</small></div>`;
        })
        .join("")
    : '<div class="empty">No upcoming release dates are available in your wishlist.</div>';
}
