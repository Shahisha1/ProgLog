import { listGames, listSessions, listActivity } from "./store.js";
import { renderGameCards } from "./ui.js";
import { $, esc, fmtHours, fmtDateTime } from "./core.js";
import { loadDiscoverCarousel } from "./games.js";

const fallback = {
  recent: [
    {
      name: "Elden Ring",
      coverUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg",
      playtimeHours: 94,
      status: "playing",
      pct: 78,
    },
    {
      name: "Cyberpunk 2077",
      coverUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
      playtimeHours: 67,
      status: "playing",
      pct: 82,
    },
    {
      name: "Hades",
      coverUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg",
      playtimeHours: 48,
      status: "completed",
      pct: 100,
    },
    {
      name: "Red Dead Redemption 2",
      coverUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg",
      playtimeHours: 100,
      status: "playing",
      pct: 54,
    },
    {
      name: "God of War",
      coverUrl:
        "https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/header.jpg",
      playtimeHours: 25,
      status: "backlog",
      pct: 45,
    },
  ],
  discover: [
    [
      "Baldur’s Gate 3",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg",
    ],
    [
      "Ghost of Tsushima",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/2215430/header.jpg",
    ],
    [
      "Starfield",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/header.jpg",
    ],
    [
      "Forza Horizon 5",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/header.jpg",
    ],
    [
      "The Witcher 3",
      "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
    ],
  ],
};

function pct(g) {
  const total = Number(g.achievementCount || g.achievements?.length || 0),
    u = Number(
      g.achievementUnlocked ||
        g.achievements?.filter((a) => a.unlocked).length ||
        0,
    );
  return total ? Math.round((u / total) * 100) : 0;
}
function gameRow(g) {
  return `<article class="dash-game"><img src="${esc(g.coverUrl || "")}" alt="${esc(g.name)} cover"><div class="dash-game-copy"><div class="split"><strong>${esc(g.name)}</strong><span class="pill ${g.status || "backlog"}">${esc(g.status || "backlog")}</span></div><div class="dash-game-meta"><span>${fmtHours(g.playtimeHours || 0)}</span><span>${pct(g)}%</span></div><div class="progress"><i style="width:${pct(g)}%"></i></div></div></article>`;
}
function activityIcon(kind) {
  return (
    {
      achievement: "trophy",
      playing: "gamepad-2",
      session: "clock-3",
      completed: "circle-check",
      game_added: "plus-circle",
    }[kind] || "activity"
  );
}
function renderActivity(items) {
  $("#dashActivity").innerHTML =
    items
      .slice(0, 5)
      .map(
        (a) =>
          `<div class="activity-item"><span class="activity-icon"><i data-lucide="${activityIcon(a.kind)}"></i></span><div><strong>${esc(a.text)}</strong><small>${fmtDateTime(a.createdAt)}</small></div></div>`,
      )
      .join("") || '<div class="empty">No activity yet.</div>';
}
function renderFriends() {
  const friends = [
    [
      "Alex",
      "https://i.pravatar.cc/80?img=12",
      "Unlocked 3 achievements in Elden Ring",
      "1h ago",
    ],
    [
      "SamuraiX",
      "https://i.pravatar.cc/80?img=32",
      "Started playing Cyberpunk 2077",
      "3h ago",
    ],
    ["Jordan", "https://i.pravatar.cc/80?img=49", "Completed Hades", "5h ago"],
    [
      "Nova",
      "https://i.pravatar.cc/80?img=47",
      "Unlocked all achievements in Hades",
      "1d ago",
    ],
  ];
  $("#dashFriends").innerHTML = friends
    .map(
      (f) =>
        `<div class="friend-activity"><img src="${f[1]}" alt=""><div><strong>${f[0]}</strong><small>${f[2]}</small></div><time>${f[3]}</time></div>`,
    )
    .join("");
}
function renderMilestones(games) {
  const total = games.reduce(
      (a, g) => a + (g.achievements?.length || g.achievementCount || 0),
      0,
    ),
    unlocked = games.reduce(
      (a, g) =>
        a +
        (g.achievements?.filter((x) => x.unlocked).length ||
          g.achievementUnlocked ||
          0),
      0,
    );
  const milestones = [
    [
      "First Steps",
      "Unlock 5 achievements",
      Math.min(unlocked, 5),
      5,
      "trophy",
    ],
    [
      "Dedicated Player",
      "Play for 10 hours",
      Math.min(
        Math.round(
          games.reduce((a, g) => a + (Number(g.playtimeHours) || 0), 0),
        ),
        10,
      ),
      10,
      "flame",
    ],
    [
      "Achievement Hunter",
      "Unlock 50 achievements",
      Math.min(unlocked, 50),
      50,
      "target",
    ],
    [
      "Game Collector",
      "Add 10 games to library",
      Math.min(games.length, 10),
      10,
      "library",
    ],
    [
      "Completionist",
      "Complete a game 100%",
      games.some((g) => pct(g) === 100) ? 1 : 0,
      1,
      "badge-check",
    ],
  ];
  $("#dashMilestones").innerHTML = milestones
    .map(
      (m) =>
        `<div class="milestone"><span class="milestone-icon"><i data-lucide="${m[4]}"></i></span><div><strong>${m[0]}</strong><small>${m[1]}</small><div class="progress"><i style="width:${Math.round((m[2] / m[3]) * 100)}%"></i></div></div><b>${m[2]} / ${m[3]}</b></div>`,
    )
    .join("");
}
function renderLibrary(games) {
  const counts = {
    playing: 0,
    completed: 0,
    backlog: 0,
    dropped: 0,
    wishlist: 0,
  };
  games.forEach((g) => (counts[g.status] = (counts[g.status] || 0) + 1));
  $("#libraryBreakdown").innerHTML = Object.entries(counts)
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<div><span><i class="legend ${k}"></i>${k[0].toUpperCase() + k.slice(1)}</span><b>${v}</b></div>`,
    )
    .join("");
  const circumference = 2 * Math.PI * 45;
  let offset = 0;
  const colors = ["#35d19a", "#6f42d8", "#3f79d9", "#ff6978", "#f3c45b"];
  const svg = document.querySelector("#libraryDonut");
  if (svg) {
    svg.innerHTML =
      Object.entries(counts)
        .filter(([, v]) => v)
        .map(([k, v], i) => {
          const len = (v / Math.max(games.length, 1)) * circumference;
          const dash = `${len} ${circumference - len}`;
          const out = `<circle cx="60" cy="60" r="45" fill="none" stroke="${colors[i % colors.length]}" stroke-width="12" stroke-dasharray="${dash}" stroke-dashoffset="-${offset}" transform="rotate(-90 60 60)"/>`;
          offset += len;
          return out;
        })
        .join("") +
      `<text x="60" y="57" text-anchor="middle" fill="white" font-size="20" font-weight="700">${games.length}</text><text x="60" y="73" text-anchor="middle" fill="#8f9bad" font-size="8">Total Games</text>`;
  }
}
export async function initDashboard() {
  const [games, sessions, activity] = await Promise.all([
    listGames(),
    listSessions(),
    listActivity(),
  ]);
  $("#heroArt").style.backgroundImage =
    "url(https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/page_bg_generated_v6b.jpg)";
  const achievements = games.flatMap((g) => g.achievements || []),
    unlocked = achievements.filter((a) => a.unlocked).length;
  const totalAchievementCount = games.reduce(
    (a, g) => a + (g.achievementCount || g.achievements?.length || 0),
    0,
  );
  const totalUnlocked = games.reduce(
    (a, g) =>
      a +
      (g.achievementUnlocked ||
        g.achievements?.filter((x) => x.unlocked).length ||
        0),
    0,
  );
  const totalHours =
    games.reduce((a, g) => a + (Number(g.playtimeHours) || 0), 0) +
    sessions.reduce((a, s) => a + (Number(s.durationMinutes) || 0) / 60, 0);
  $("#dashGames").textContent = games.length;
  $("#dashHours").textContent = fmtHours(totalHours);
  $("#dashAchievements").textContent = totalUnlocked.toLocaleString();
  $("#dashCompletion").textContent = totalAchievementCount
    ? `${Math.round((totalUnlocked / totalAchievementCount) * 100)}%`
    : "0%";
  $("#dashGamesChange").textContent = games.length
    ? `${games.length} in your library`
    : "Add games to get started";
  $("#dashHoursChange").textContent = "Across saved games";
  $("#dashAchievementsChange").textContent = totalUnlocked
    ? "Unlocked across library"
    : "No achievements yet";
  $("#dashCompletionChange").textContent = "Achievement progress";
  const recent = games.slice(0, 5);
  $("#recentGames").innerHTML = recent.map(gameRow).join("");
  renderActivity(activity);
  renderMilestones(games);
  renderLibrary(games);
  renderFriends();
  const continueGame = recent[0];
  if (continueGame) {
    $("#continueTitle").textContent = continueGame.name;
    $("#continueCover").src = continueGame.coverUrl || "";
    $("#continueProgress").textContent = `${pct(continueGame)}% Complete`;
    $("#continueMeta").textContent =
      `You've unlocked ${continueGame.achievementUnlocked || Math.round((pct(continueGame) / 100) * (continueGame.achievementCount || 42))} / ${continueGame.achievementCount || 42} achievements`;
  }
  $("#discoverFallback").innerHTML = fallback.discover
    .map(
      ([n, u]) =>
        `<a class="discover-card" href="pages/games.html?q=${encodeURIComponent(n)}"><img src="${u}" alt="${n} cover"><strong>${n}</strong><small>Discover</small></a>`,
    )
    .join("");
  await loadDiscoverCarousel();
  if (window.lucide) window.lucide.createIcons();
}
