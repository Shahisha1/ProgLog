import { auth, configured, db } from "./modules/firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { $, $$, showToast, relPath } from "./modules/core.js";
import { setupShell, setUser, navCurrent } from "./modules/ui.js";
import { initAuth } from "./modules/auth-ui.js";
import { initContact } from "./modules/contact.js";
import { initGames } from "./modules/games.js";
import { initGame } from "./modules/game-detail.js";
import { initAchievements } from "./modules/achievements.js";
import { initSessions } from "./modules/sessions.js";
import { initFriends } from "./modules/friends.js";
import { initProfile, initStats } from "./modules/profile.js";
import { initSettings } from "./modules/settings.js";
import { initWishlist } from "./modules/wishlist.js";
import { initCompare } from "./modules/compare.js";
import { initJourney } from "./modules/journey.js";
import { initNotifications } from "./modules/notifications.js";
import { initDashboard } from "./modules/home-dashboard.js";
import { initLanding } from "./modules/home.js";
import { initSteam } from "./modules/steam.js";
import { initTrophies } from "./modules/trophies.js";
import { maybeOnboard } from "./modules/onboarding.js";

await setupShell();
navCurrent();
function globalSearch() {
  const s = $("#siteSearch");
  s?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && s.value.trim())
      location.href = `${relPath()}pages/games.html?q=${encodeURIComponent(s.value.trim())}`;
  });
}
globalSearch();
async function syncUser(u) {
  if (!db || !u) return null;
  try {
    const ref = doc(db, "users", u.uid),
      snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        {
          displayName: u.displayName || u.email?.split("@")[0] || "Gamer",
          email: u.email || "",
          visibility: "Public",
          activityVisible: true,
          friendCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return {};
    }
    return snap.data() || {};
  } catch (e) {
    console.warn("user sync", e);
    return null;
  }
}
$$(".sign-out").forEach((b) =>
  b.addEventListener("click", async () => {
    try {
      sessionStorage.removeItem("proglog-demo-session");
    } catch (e) {}
    if (auth) await signOut(auth);
    location.href = `${relPath()}index.html`;
  }),
);
const PRIVATE_PAGES = new Set([
  "overview.html",
  "games.html",
  "game.html",
  "achievements.html",
  "sessions.html",
  "friends.html",
  "profile.html",
  "settings.html",
  "wishlist.html",
  "compare.html",
  "journey.html",
  "notifications.html",
  "stats.html",
  "trophies.html",
  "steam.html",
]);
let lastUser;
const demoSession = () => {
  try {
    return sessionStorage.getItem("proglog-demo-session") === "1";
  } catch (e) {
    return false;
  }
};
const demoUser = {
  uid: null,
  displayName: "Shahisha",
  email: "demo@proglog.local",
  photoURL: "assets/images/avatar.svg",
  isDemo: true,
};
if (configured && auth) {
  onAuthStateChanged(auth, async (u) => {
    lastUser = u;
    const effective = u || (demoSession() ? demoUser : null);
    setUser(effective);
    const p = location.pathname.split("/").pop() || "index.html";
    if (PRIVATE_PAGES.has(p) && !effective) {
      location.replace(
        `${relPath()}pages/auth.html?next=${encodeURIComponent(location.pathname.split("/").pop())}`,
      );
      return;
    }
    const profile = await syncUser(u);
    const finalUser = u && profile ? { ...u, ...profile } : effective;
    setUser(finalUser);
    await maybeOnboard(finalUser);
    await dispatch(finalUser);
  });
} else {
  const effective = demoSession() ? demoUser : null;
  setUser(effective);
  const p = location.pathname.split("/").pop() || "index.html";
  if (PRIVATE_PAGES.has(p) && !effective)
    location.replace(`${relPath()}pages/auth.html`);
  else {
    await maybeOnboard(effective);
    dispatch(effective);
  }
}
async function dispatch(u) {
  const p = location.pathname.split("/").pop() || "index.html";
  try {
    if (p === "index.html") await initLanding();
    else if (p === "auth.html") initAuth();
    else if (p === "contact.html") initContact();
    else if (p === "games.html") await initGames();
    else if (p === "game.html") await initGame();
    else if (p === "achievements.html") await initAchievements();
    else if (p === "sessions.html") await initSessions();
    else if (p === "friends.html") await initFriends();
    else if (p === "profile.html") await initProfile();
    else if (p === "settings.html") await initSettings();
    else if (p === "wishlist.html") await initWishlist();
    else if (p === "compare.html") await initCompare();
    else if (p === "journey.html") await initJourney();
    else if (p === "notifications.html") await initNotifications();
    else if (p === "stats.html") await initStats();
    else if (p === "trophies.html") await initTrophies();
    else if (p === "overview.html") await initDashboard();
    else if (p === "steam.html") await initSteam();
  } catch (e) {
    console.error(e);
    showToast(e.message || "Something went wrong.", "error");
  }
}
if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  navigator.serviceWorker
    .register(`${location.origin}/ProgLog/sw.js`)
    .catch(() => {});
