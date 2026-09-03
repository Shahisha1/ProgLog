import { listGames, listSessions, listActivity } from "./store.js";
import { $, esc, fmtDateTime } from "./core.js";
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
      text: `Status: ${g.status || "backlog"}`,
    });
    if (g.completedAt)
      items.push({
        date: g.completedAt,
        title: `Completed ${g.name}`,
        text: "Game marked completed.",
      });
  });
  sessions.forEach((s) =>
    items.push({
      date: s.date,
      title: `Played ${s.gameName}`,
      text: `${Math.round(Number(s.durationMinutes) || 0)} minutes${s.note ? ` · ${s.note}` : ""}`,
    }),
  );
  activity.forEach((a) =>
    items.push({
      date: a.createdAt,
      title: a.text,
      text: a.kind || "Activity",
    }),
  );
  items.sort((x, y) => new Date(y.date) - new Date(x.date));
  $("#journeyTimeline").innerHTML =
    items
      .slice(0, 100)
      .map(
        (i) =>
          `<div class="journey-item"><div class="dot"></div><div><strong>${esc(i.title)}</strong><p>${esc(i.text)}</p><small>${fmtDateTime(i.date)}</small></div></div>`,
      )
      .join("") ||
    '<div class="empty">Your journey will appear here as you play.</div>';
}
