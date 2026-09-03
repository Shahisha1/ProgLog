import {
  $$,
  $,
  esc,
  relPath,
  fmtDate,
  fmtDateTime,
  showToast,
} from "./core.js";
import { auth, configured } from "./firebase.js";

const PRIMARY = [
  "overview.html",
  "games.html",
  "achievements.html",
  "sessions.html",
  "trophies.html",
  "friends.html",
];
const ICONS = {
  "overview.html": "layout-dashboard",
  "games.html": "library",
  "achievements.html": "trophy",
  "sessions.html": "clock-3",
  "trophies.html": "award",
  "friends.html": "users",
  "journey.html": "route",
  "wishlist.html": "star",
  "stats.html": "chart-no-axes-combined",
  "compare.html": "arrow-left-right",
  "profile.html": "user-round",
  "settings.html": "settings",
  "notifications.html": "bell",
  "steam.html": "link-2",
  "contact.html": "mail",
};
function fileOf(href) {
  return (
    String(href || "")
      .split("?")[0]
      .split("/")
      .pop() || ""
  );
}
function loadLucide() {
  if (window.lucide) return Promise.resolve();
  if (window.__lucideReady) return window.__lucideReady;
  window.__lucideReady = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js";
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
  return window.__lucideReady;
}
function normalizeIcons() {
  const brand = $(".brand-mark");
  if (brand) brand.innerHTML = '<i data-lucide="gamepad-2"></i>';
  $$(".nav a").forEach((a) => {
    const f = fileOf(a.getAttribute("href"));
    a.classList.toggle("nav-primary", PRIMARY.includes(f));
    const holder = $(".nav-icon", a);
    if (holder && ICONS[f])
      holder.innerHTML = `<i data-lucide="${ICONS[f]}"></i>`;
  });
  const searchIcon = $(".search-icon");
  if (searchIcon) searchIcon.innerHTML = '<i data-lucide="search"></i>';
  const mobile = $("#menuButton");
  if (mobile) mobile.innerHTML = '<i data-lucide="menu"></i>';
  const top = $(".top-nav");
  if (top) {
    top.querySelectorAll("a").forEach((a) => {
      const f = fileOf(a.getAttribute("href"));
      const i = a.querySelector("i[data-lucide]");
      if (i && ICONS[f]) i.setAttribute("data-lucide", ICONS[f]);
    });
  }
}
function ensureTopNav() {
  const topbar = $(".topbar");
  const nav = $(".nav");
  if (!topbar || !nav || $(".top-nav")) return;
  const top = document.createElement("nav");
  top.className = "top-nav";
  top.setAttribute("aria-label", "Primary navigation");
  [...nav.querySelectorAll("a.nav-primary")].forEach((a) => {
    const clone = a.cloneNode(true);
    clone.classList.remove("nav-primary");
    clone
      .querySelector(".nav-icon")
      ?.replaceWith(
        Object.assign(document.createElement("i"), {
          dataset: {
            lucide: ICONS[fileOf(a.getAttribute("href"))] || "circle",
          },
        }),
      );
    const icon = clone.querySelector("i");
    if (icon)
      icon.setAttribute(
        "data-lucide",
        ICONS[fileOf(a.getAttribute("href"))] || "circle",
      );
    top.appendChild(clone);
  });
  topbar.insertBefore(top, topbar.firstChild);
}
export async function setupShell() {
  await loadLucide();
  normalizeIcons();
  ensureTopNav();
  const sidebar = $(".sidebar"),
    menu = $("#menuButton");
  menu?.addEventListener("click", () => {
    const open = sidebar?.classList.toggle("mobile-open");
    document.body.classList.toggle("menu-open", !!open);
    menu?.setAttribute("aria-expanded", String(!!open));
  });
  $$(".nav a").forEach((a) =>
    a.addEventListener("click", () => {
      sidebar?.classList.remove("mobile-open");
      document.body.classList.remove("menu-open");
    }),
  );
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
  window.lucide?.createIcons();
}
export function setUser(user) {
  const names = $$(".user-name");
  const n = user?.displayName || user?.email?.split("@")[0] || "Guest";
  names.forEach((x) => (x.textContent = n));
  $$("[data-user-avatar]").forEach((x) => {
    if (user?.photoURL) x.src = user.photoURL;
  });
  $$(".auth-link").forEach((x) => {
    x.textContent = user ? "Profile" : "Sign in";
    x.href = user
      ? `${relPath()}pages/profile.html`
      : `${relPath()}pages/auth.html`;
  });
  $$(".sidebar-bottom small").forEach((x) => {
    if (x.textContent.includes("Sign in to save progress"))
      x.textContent = user ? "Level 24 · 72% XP" : "Sign in to save progress";
  });
  window.lucide?.createIcons();
}
export function navCurrent() {
  const p = location.pathname.split("/").pop() || "index.html";
  $$(".nav a,.top-nav a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.toggleAttribute("aria-current", href.split("?")[0].endsWith(p));
  });
}
export function renderGameCards(games, container, { large = false } = {}) {
  if (!container) return;
  if (!games.length) {
    container.innerHTML =
      '<div class="empty">Nothing here yet. Add a game from Discover.</div>';
    return;
  }
  container.innerHTML = games
    .map(
      (g) =>
        `<a class="game-card ${large ? "large" : ""}" href="${relPath()}pages/game.html?id=${encodeURIComponent(g.id || g.rawgId)}"><img src="${esc(g.coverUrl || "")}" alt="${esc(g.name)} cover" loading="lazy"><strong>${esc(g.name)}</strong><small>${esc(g.status || "Backlog")}${g.playtimeHours ? ` · ${Number(g.playtimeHours).toFixed(1)}h` : ""}</small></a>`,
    )
    .join("");
  window.lucide?.createIcons();
}
export const statusClass = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
