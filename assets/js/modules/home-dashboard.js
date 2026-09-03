import { listGames, listSessions, listActivity } from "./store.js";
import { loadDiscoverCarousel } from "./games.js";
import { $, esc, fmtHours, fmtDateTime } from "./core.js";

const fallbackDiscover = [
  [
    "Baldur’s Gate 3",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/header.jpg",
  ],
  [
    "Ghost of Tsushima",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/2215430/header.jpg",
  ],
  [
    "Stardew Valley",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/header.jpg",
  ],
  [
    "The Witcher 3",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/header.jpg",
  ],
  [
    "Hades II",
    "https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/header.jpg",
  ],
];
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
  return `<a class="dash-game" href="pages/game.html?id=${encodeURIComponent(g.id || g.rawgId || "")}"><img src="${esc(g.coverUrl || "")}" alt="${esc(g.name)} cover" loading="lazy"><div class="dash-game-copy"><div class="split"><strong>${esc(g.name)}</strong><span class="pill ${g.status || "backlog"}">${esc(g.status || "backlog")}</span></div><div class="dash-game-meta"><span>${fmtHours(g.playtimeHours || 0)}</span><span>${pct(g)}%</span></div><div class="progress"><i style="width:${pct(g)}%"></i></div></div></a>`;
}
function activityIcon(kind) {
  return (
    {
      achievement: "trophy",
      playing: "gamepad-2",
      session: "clock-3",
      completed: "circle-check",
      game_added: "plus-circle",
      library_import: "upload",
    }[kind] || "activity"
  );
}
function renderActivity(items) {
  const box = $("#dashActivity");
  if (!box) return;
  box.innerHTML =
    items
      .slice(0, 6)
      .map(
        (a) =>
          `<div class="activity-item"><span class="activity-icon"><i data-lucide="${activityIcon(a.kind)}"></i></span><div><strong>${esc(a.text)}</strong><small>${fmtDateTime(a.createdAt)}</small></div></div>`,
      )
      .join("") || '<div class="empty">Your activity will appear here.</div>';
}
function renderFriends() {
  const box = $("#dashFriends");
  if (!box) return;
  let demo = false;
  try {
    demo = sessionStorage.getItem("proglog-demo-session") === "1";
  } catch (e) {}
  if (!demo) {
    box.innerHTML =
      '<div class="empty friends-empty"><i data-lucide="users"></i><strong>Your friends are waiting.</strong><span>Add friends to see their latest gaming activity here.</span><a class="btn" href="pages/friends.html">Find friends</a></div>';
    return;
  }
  const friends = [
    ["Alex", "12", "Unlocked 3 achievements in Elden Ring", "1h ago"],
    ["SamuraiX", "32", "Started playing Cyberpunk 2077", "3h ago"],
    ["Jordan", "49", "Completed Hades", "5h ago"],
    ["Nova", "47", "Added 2 games to wishlist", "1d ago"],
  ];
  box.innerHTML = friends
    .map(
      (f) =>
        `<div class="friend-activity"><img src="https://i.pravatar.cc/80?img=${f[1]}" alt=""><div><strong>${f[0]}</strong><small>${f[2]}</small></div><time>${f[3]}</time></div>`,
    )
    .join("");
}
function renderMilestones(games) {
  const totalUnlocked = games.reduce(
    (a, g) =>
      a +
      (Number(g.achievementUnlocked) ||
        g.achievements?.filter((x) => x.unlocked).length ||
        0),
    0,
  );
  const hours = games.reduce((a, g) => a + (Number(g.playtimeHours) || 0), 0);
  const milestones = [
    [
      "First Steps",
      "Unlock 5 achievements",
      Math.min(totalUnlocked, 5),
      5,
      "trophy",
    ],
    [
      "Dedicated Player",
      "Play for 10 hours",
      Math.min(Math.round(hours), 10),
      10,
      "flame",
    ],
    [
      "Achievement Hunter",
      "Unlock 50 achievements",
      Math.min(totalUnlocked, 50),
      50,
      "target",
    ],
    [
      "Game Collector",
      "Add 10 games to your library",
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
  const box = $("#dashMilestones");
  if (box)
    box.innerHTML = milestones
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
  const box = $("#libraryBreakdown");
  if (box)
    box.innerHTML =
      Object.entries(counts)
        .filter(([, v]) => v)
        .map(
          ([k, v]) =>
            `<div><span><i class="legend ${k}"></i>${k[0].toUpperCase() + k.slice(1)}</span><b>${v}</b></div>`,
        )
        .join("") || '<div class="empty">Your shelf is empty.</div>';
  const circumference = 2 * Math.PI * 45;
  let offset = 0;
  const colors = ["#5b63e6", "#57c69b", "#f0b94b", "#d66b7a", "#a07bce"];
  const svg = $("#libraryDonut");
  if (svg) {
    svg.innerHTML =
      Object.entries(counts)
        .filter(([, v]) => v)
        .map(([k, v], i) => {
          const len = (v / Math.max(games.length, 1)) * circumference;
          const out = `<circle cx="60" cy="60" r="45" fill="none" stroke="${colors[i % colors.length]}" stroke-width="12" stroke-dasharray="${len} ${circumference - len}" stroke-dashoffset="-${offset}" transform="rotate(-90 60 60)"/>`;
          offset += len;
          return out;
        })
        .join("") +
      `<text x="60" y="57" text-anchor="middle" fill="currentColor" font-size="20" font-weight="800">${games.length}</text><text x="60" y="73" text-anchor="middle" fill="#929aa5" font-size="8">GAMES</text>`;
  }
}
function renderRhythm(sessions) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  const mins = days.map((d) =>
    sessions
      .filter((s) => {
        const x = new Date(s.date);
        return (
          x.getFullYear() === d.getFullYear() &&
          x.getMonth() === d.getMonth() &&
          x.getDate() === d.getDate()
        );
      })
      .reduce((a, s) => a + (Number(s.durationMinutes) || 0), 0),
  );
  const total = mins.reduce((a, b) => a + b, 0);
  $("#rhythmHours") && ($("#rhythmHours").textContent = fmtHours(total / 60));
  const max = Math.max(...mins, 60);
  const box = $("#rhythmBars");
  if (box)
    box.innerHTML = mins
      .map(
        (m, i) =>
          `<span style="height:${Math.max(8, Math.round((m / max) * 74))}px" title="${fmtHours(m / 60)}"></span>`,
      )
      .join("");
}
function renderJourney(games, sessions, activity) {
  const box = $("#dashJourney");
  if (!box) return;
  const items = [];
  games.forEach((g) =>
    items.push({
      date: g.createdAt || new Date().toISOString(),
      title: `Added ${g.name}`,
      icon: "plus",
    }),
  );
  sessions.forEach((s) =>
    items.push({
      date: s.date,
      title: `Played ${s.gameName || "a game"}`,
      icon: "gamepad-2",
    }),
  );
  activity.forEach((a) =>
    items.push({
      date: a.createdAt,
      title: a.text,
      icon: activityIcon(a.kind),
    }),
  );
  items.sort((a, b) => new Date(a.date) - new Date(b.date));
  const recent = items.slice(-5);
  if (!recent.length) {
    box.innerHTML =
      '<div class="empty journey-empty"><i data-lucide="map"></i><strong>Your story starts here.</strong><span>Add a game or log a session to create your first moment.</span></div>';
    return;
  }
  box.innerHTML = `<div class="journey-line"></div>${recent.map((i, idx) => `<div class="journey-preview-item"><span class="journey-preview-dot"><i data-lucide="${i.icon}"></i></span><div><strong>${esc(i.title)}</strong><small>${fmtDateTime(i.date)}</small></div>${idx === recent.length - 1 ? '<span class="journey-current">latest</span>' : ""}</div>`).join("")}`;
}

export async function initDashboard() {
  const [games, sessions, activity] = await Promise.all([
    listGames(),
    listSessions(),
    listActivity(),
  ]);
  const achievements = games.flatMap((g) => g.achievements || []);
  const totalCount = games.reduce(
    (a, g) => a + (Number(g.achievementCount) || g.achievements?.length || 0),
    0,
  );
  const totalUnlocked = games.reduce(
    (a, g) =>
      a +
      (Number(g.achievementUnlocked) ||
        g.achievements?.filter((x) => x.unlocked).length ||
        0),
    0,
  );
  const totalHours =
    games.reduce((a, g) => a + (Number(g.playtimeHours) || 0), 0) +
    sessions.reduce((a, s) => a + (Number(s.durationMinutes) || 0) / 60, 0);
  const hero = games.find((g) => g.status === "playing") || games[0];
  $("#heroArt")?.style.setProperty(
    "background-image",
    `url(${hero?.backgroundUrl || hero?.coverUrl || "https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/page_bg_generated_v6b.jpg"})`,
  );
  $("#dashGames").textContent = games.length;
  $("#dashHours").textContent = fmtHours(totalHours);
  $("#dashAchievements").textContent = totalUnlocked.toLocaleString();
  $("#dashCompletion").textContent = totalCount
    ? `${Math.round((totalUnlocked / totalCount) * 100)}%`
    : "0%";
  $("#dashGamesChange").textContent = games.length
    ? `${games.filter((g) => g.status === "playing").length} currently playing`
    : "Add your first game";
  $("#dashHoursChange").textContent = sessions.length
    ? `${sessions.length} logged sessions`
    : "Log a session to start";
  $("#dashAchievementsChange").textContent = totalUnlocked
    ? `${totalCount - totalUnlocked} still to unlock`
    : "Start your first hunt";
  $("#dashCompletionChange").textContent = totalCount
    ? `${totalCount} achievements tracked`
    : "No achievement data yet";
  const recent = games.filter((g) => g.status !== "wishlist").slice(0, 5);
  $("#recentGames").innerHTML =
    recent.map(gameRow).join("") ||
    '<div class="empty">Nothing here yet. <a class="link" href="pages/games.html">Add a game</a>.</div>';
  const current = games.find((g) => g.status === "playing") || games[0];
  if (current) {
    $("#continueTitle").textContent = current.name;
    $("#continueCover").src =
      current.coverUrl || current.backgroundUrl || "assets/images/cover.svg";
    $("#continueProgress").textContent =
      `${pct(current)}% complete · ${fmtHours(current.playtimeHours || 0)} played`;
    $("#continueMeta").textContent =
      `${current.achievementUnlocked || current.achievements?.filter((a) => a.unlocked).length || 0} / ${current.achievementCount || current.achievements?.length || 0} achievements unlocked`;
  }
  renderRhythm(sessions);
  renderActivity(activity);
  renderMilestones(games);
  renderLibrary(games);
  renderJourney(games, sessions, activity);
  renderFriends();
  const fallback = $("#discoverGames");
  if (fallback && !fallback.children.length)
    fallback.innerHTML = fallbackDiscover
      .map(
        ([n, u]) =>
          `<a class="game-tile" href="pages/games.html?q=${encodeURIComponent(n)}"><img src="${u}" alt="${n}" loading="lazy"><div class="game-copy"><strong>${n}</strong><small>Discover</small></div></a>`,
      )
      .join("");
  await loadDiscoverCarousel();
  window.lucide?.createIcons();
}
