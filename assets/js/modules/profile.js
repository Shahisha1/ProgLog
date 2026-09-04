import { auth, db } from "./firebase.js";
import { setupAvatarStudio } from "./avatar-studio.js";
import { avatarData, avatarConfigFromUser } from "./avatar.js";
import {
  getUserDoc,
  saveUserDoc,
  listGames,
  listSessions,
  listFriends,
  listActivity,
} from "./store.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { $, esc, fmtHours, fmtDate, showToast } from "./core.js";
export async function initProfile() {
  const params = new URLSearchParams(location.search),
    requested = params.get("uid");
  let user = await getUserDoc();
  if (requested && db) {
    try {
      const s = await getDoc(doc(db, "users", requested));
      if (s.exists()) user = { id: s.id, ...s.data(), readonly: true };
    } catch {}
  }
  user = user || {
    displayName:
      auth?.currentUser?.displayName ||
      auth?.currentUser?.email?.split("@")[0] ||
      "Guest",
    bio: "",
    visibility: "Public",
  };
  $("#profileName").textContent = user.displayName || "Gamer";
  if ($("#avatarStudio")) setupAvatarStudio(user, !user.readonly);
  document
    .querySelectorAll("[data-user-avatar]")
    .forEach((x) => (x.src = avatarData(avatarConfigFromUser(user))));
  $("#profileBio").textContent = user.bio || "No bio yet.";
  $("#profileVisibility").textContent = user.visibility || "Public";
  const ownerId = user.id || auth?.currentUser?.uid;
  const games = await listGames(ownerId),
    sessions = user.readonly ? [] : await listSessions(),
    friends = user.readonly ? [] : await listFriends();
  const ach = games.flatMap((g) => g.achievements || []);
  const unlocked = ach.filter((a) => a.unlocked).length;
  $("#profileGames").textContent = games.length;
  $("#profileHours").textContent = fmtHours(
    games.reduce((a, g) => a + (Number(g.playtimeHours) || 0), 0) +
      sessions.reduce((a, s) => a + (Number(s.durationMinutes) || 0) / 60, 0),
  );
  $("#profileAchievements").textContent = unlocked;
  $("#profileFriends").textContent = user.friendCount ?? friends.length;
  const recent = $("#profileGamesList");
  recent.innerHTML =
    games
      .slice(0, 8)
      .map(
        (g) =>
          `<a class="game-card" href="game.html?id=${encodeURIComponent(g.id)}"><img src="${esc(g.coverUrl || "")}" alt="${esc(g.name)} cover" loading="lazy"><strong>${esc(g.name)}</strong><small>${esc(g.status || "Backlog")}</small></a>`,
      )
      .join("") || '<div class="empty">No games added yet.</div>';
  if (!user.readonly)
    $("#profileForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveUserDoc({
        displayName: $("#displayName").value.trim() || "Gamer",
        bio: $("#bio").value.trim(),
        visibility: $("#visibility").value,
        activityVisible: $("#activityVisible").checked,
      });
      showToast("Profile saved.");
    });
  if ($("#displayName")) $("#displayName").value = user.displayName || "";
  if ($("#bio")) $("#bio").value = user.bio || "";
  if ($("#visibility")) $("#visibility").value = user.visibility || "Public";
  if ($("#activityVisible"))
    $("#activityVisible").checked = user.activityVisible !== false;
}
export async function initStats() {
  const games = await listGames(),
    sessions = await listSessions();
  const all = games.flatMap((g) => g.achievements || []),
    unlocked = all.filter((a) => a.unlocked).length;
  const totalHours =
    games.reduce((a, g) => a + (Number(g.playtimeHours) || 0), 0) +
    sessions.reduce((a, s) => a + (Number(s.durationMinutes) || 0) / 60, 0);
  const byGenre = {};
  games.forEach((g) =>
    (g.genres || []).forEach((x) => {
      const n = x.name || x;
      byGenre[n] = (byGenre[n] || 0) + 1;
    }),
  );
  const topGenre = Object.entries(byGenre).sort((a, b) => b[1] - a[1])[0];
  $("#statGames").textContent = games.length;
  $("#statHours").textContent = fmtHours(totalHours);
  $("#statAchievements").textContent = unlocked;
  $("#statCompletion").textContent = all.length
    ? `${Math.round((unlocked / all.length) * 100)}%`
    : "0%";
  $("#statGenre").textContent = topGenre
    ? `${topGenre[0]} (${topGenre[1]})`
    : "—";
  const days = new Set(
    sessions.map((s) => new Date(s.date).toISOString().slice(0, 10)),
  );
  let streak = 0;
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  $("#statStreak") &&
    ($("#statStreak").textContent = `${streak} day${streak === 1 ? "" : "s"}`);
  $("#statCompleted").textContent = games.filter(
    (g) => g.status === "completed",
  ).length;
  $("#statPlaying").textContent = games.filter(
    (g) => g.status === "playing",
  ).length;
  $("#statBacklog").textContent = games.filter(
    (g) => g.status === "backlog",
  ).length;
  const rows = games
    .slice()
    .sort(
      (a, b) => (Number(b.playtimeHours) || 0) - (Number(a.playtimeHours) || 0),
    )
    .slice(0, 10);
  $("#statsTable").innerHTML =
    rows
      .map(
        (g) =>
          `<tr><td><img src="${esc(g.coverUrl || "")}" alt="">${esc(g.name)}</td><td>${fmtHours(g.playtimeHours || 0)}</td><td>${g.achievements?.filter((a) => a.unlocked).length || 0}/${g.achievements?.length || 0}</td><td>${esc(g.status || "Backlog")}</td></tr>`,
      )
      .join("") || '<tr><td colspan="4">No data yet.</td></tr>';
}
