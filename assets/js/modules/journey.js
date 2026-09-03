import { listGames, listSessions, listActivity } from "./store.js";
import { $, esc, fmtDateTime, fmtHours } from "./core.js";

function dateValue(v) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function labelFor(d) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function iconFor(kind) {
  return (
    {
      game: "gamepad-2",
      session: "clock-3",
      achievement: "trophy",
      completed: "circle-check",
      game_added: "plus-circle",
    }[kind] || "sparkles"
  );
}

export async function initJourney() {
  const [games, sessions, activity] = await Promise.all([
    listGames(),
    listSessions(),
    listActivity(),
  ]);
  const items = [];
  games.forEach((g) => {
    items.push({
      date: g.createdAt || new Date().toISOString(),
      title: `Added ${g.name}`,
      text: `Moved to ${g.status || "backlog"}.`,
      kind: "game",
    });
    if (g.completedAt)
      items.push({
        date: g.completedAt,
        title: `Completed ${g.name}`,
        text: "Marked as completed.",
        kind: "completed",
      });
  });
  sessions.forEach((s) =>
    items.push({
      date: s.date,
      title: `Played ${s.gameName || "a game"}`,
      text: `${Math.round(Number(s.durationMinutes) || 0)} minutes${s.note ? ` · ${s.note}` : ""}`,
      kind: "session",
    }),
  );
  activity.forEach((a) =>
    items.push({
      date: a.createdAt,
      title: a.text,
      text: a.kind?.replaceAll("_", " ") || "Activity",
      kind: a.kind,
    }),
  );
  items.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  const totalHours =
    games.reduce((a, g) => a + (Number(g.playtimeHours) || 0), 0) +
    sessions.reduce((a, s) => a + (Number(s.durationMinutes) || 0) / 60, 0);
  const ach = games.flatMap((g) => g.achievements || []),
    unlocked = ach.filter((a) => a.unlocked).length;
  const completed = games.filter((g) => g.status === "completed").length;
  if ($("#journeyGames")) $("#journeyGames").textContent = games.length;
  if ($("#journeyHours")) $("#journeyHours").textContent = fmtHours(totalHours);
  if ($("#journeyAchievements"))
    $("#journeyAchievements").textContent = unlocked;
  if ($("#journeyCompleted")) $("#journeyCompleted").textContent = completed;
  const current = games.find((g) => g.status === "playing") || games[0];
  if ($("#journeyCurrent") && current) {
    $("#journeyCurrent").innerHTML =
      `<img src="${esc(current.coverUrl || "assets/images/cover.svg")}" alt=""><div><small>Right now</small><strong>${esc(current.name)}</strong><span>${Math.round(((current.achievementUnlocked || 0) / (current.achievementCount || 1)) * 100)}% achievement progress · ${fmtHours(current.playtimeHours || 0)} played</span></div><a class="btn" href="game.html?id=${encodeURIComponent(current.id)}">Open game <i data-lucide="arrow-up-right"></i></a>`;
  }
  const groups = {};
  items.slice(0, 120).forEach((i) => {
    const d = dateValue(i.date),
      k = monthKey(d);
    (groups[k] ??= { date: d, items: [] }).items.push(i);
  });
  const html = Object.values(groups)
    .sort((a, b) => b.date - a.date)
    .map(
      (g) =>
        `<section class="journey-month"><div class="journey-month-head"><span>${labelFor(g.date)}</span><b>${g.items.length} ${g.items.length === 1 ? "moment" : "moments"}</b></div><div class="journey-track">${g.items
          .map((i) => {
            const d = dateValue(i.date);
            return `<article class="journey-event"><span class="journey-dot"><i data-lucide="${iconFor(i.kind)}"></i></span><div class="journey-event-copy"><strong>${esc(i.title)}</strong><p>${esc(i.text)}</p><time>${fmtDateTime(d)}</time></div></article>`;
          })
          .join("")}</div></section>`,
    )
    .join("");
  $("#journeyTimeline").innerHTML =
    html ||
    '<div class="empty journey-empty"><i data-lucide="map"></i><strong>Your story starts here.</strong><span>Add a game or log a session and progLog will build the timeline.</span><a class="btn btn-primary" href="games.html">Add your first game</a></div>';
  window.lucide?.createIcons();
}
