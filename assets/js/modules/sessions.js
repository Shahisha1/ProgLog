import {
  listSessions,
  saveSession,
  deleteSession,
  listGames,
  addActivity,
} from "./store.js";
import { $, esc, fmtDateTime, fmtHours, showToast } from "./core.js";
export async function initSessions() {
  const games = await listGames(),
    sessions = await listSessions(),
    select = $("#sessionGame");
  if (select)
    select.innerHTML =
      '<option value="">Choose a game</option>' +
      games
        .map((g) => `<option value="${esc(g.id)}">${esc(g.name)}</option>`)
        .join("");
  const box = $("#sessionList");
  function render() {
    box.innerHTML = sessions.length
      ? sessions
          .map((s) => {
            const g = games.find((x) => x.id === s.gameId);
            return `<article class="result"><img src="${esc(g?.coverUrl || "")}" alt="" loading="lazy"><div><h3>${esc(s.gameName || g?.name || "Game session")}</h3><p>${fmtDateTime(s.date)} · ${fmtHours((Number(s.durationMinutes) || 0) / 60)}</p><small>${esc(s.note || "No notes")}</small></div><button class="btn btn-danger delete-session" data-id="${esc(s.id)}" type="button">Delete</button></article>`;
          })
          .join("")
      : '<div class="empty">No sessions yet.</div>';
  }
  render();
  $("#sessionCreate")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const game = games.find((g) => g.id === select.value);
    if (!game) return showToast("Choose a game first.", "error");
    const minutes = Number($("#duration").value);
    if (!Number.isFinite(minutes) || minutes <= 0)
      return showToast("Enter a valid duration.", "error");
    const s = await saveSession({
      gameId: game.id,
      gameName: game.name,
      date: $("#sessionDate").value || new Date().toISOString(),
      durationMinutes: minutes,
      note: $("#sessionNote").value.trim(),
    });
    sessions.unshift({ ...s, date: s.date || new Date().toISOString() });
    await addActivity(
      "session",
      `Logged ${fmtHours(minutes / 60)} on ${game.name}`,
      { gameId: game.id },
    );
    render();
    e.target.reset();
    showToast("Session saved.");
  });
  box?.addEventListener("click", async (e) => {
    const b = e.target.closest(".delete-session");
    if (!b) return;
    await deleteSession(b.dataset.id);
    const i = sessions.findIndex((x) => x.id === b.dataset.id);
    if (i >= 0) sessions.splice(i, 1);
    render();
    showToast("Session deleted.");
  });
}
