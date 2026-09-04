import { $$, $, esc, relPath, showToast } from "./core.js";
import { auth } from "./firebase.js";
import { avatarData, avatarConfigFromUser } from "./avatar.js";

const PRIMARY = [
  "overview.html",
  "games.html",
  "achievements.html",
  "sessions.html",
  "trophies.html",
  "friends.html",
];
const HIDDEN_NAV = new Set(["compare.html", "contact.html", "steam.html"]);
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
  "steam.html": "unlink-2",
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
  if (brand) {
    brand.innerHTML =
      '<img class="brand-logo" src="' +
      (location.pathname.includes("/pages/") ? "../" : "") +
      'assets/images/proglog-logo-128.png" alt="" aria-hidden="true">';
  }
  $$(".nav a").forEach((a) => {
    const f = fileOf(a.getAttribute("href"));
    a.classList.toggle("nav-primary", PRIMARY.includes(f));
    a.classList.toggle("nav-hidden", HIDDEN_NAV.has(f));
    const holder = $(".nav-icon", a);
    if (holder && ICONS[f])
      holder.innerHTML = `<i data-lucide="${ICONS[f]}"></i>`;
  });
  const searchIcon = $(".search-icon");
  if (searchIcon) searchIcon.innerHTML = '<i data-lucide="search"></i>';
  const mobile = $("#menuButton");
  if (mobile) mobile.innerHTML = '<i data-lucide="menu"></i>';
  $$(".top-actions .icon-link").forEach((a) => {
    const label = (a.getAttribute("aria-label") || "").toLowerCase();
    const name = label.includes("notification")
      ? "bell"
      : label.includes("friend")
        ? "users"
        : "circle";
    a.innerHTML = `<i data-lucide="${name}"></i>`;
  });
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
  const topbar = $(".topbar"),
    nav = $(".nav");
  if (!topbar || !nav || $(".top-nav")) return;
  const top = document.createElement("nav");
  top.className = "top-nav";
  top.setAttribute("aria-label", "Primary navigation");
  [...nav.querySelectorAll("a.nav-primary")].forEach((a) => {
    const clone = a.cloneNode(true);
    clone.classList.remove("nav-primary");
    const holder = clone.querySelector(".nav-icon");
    if (holder) {
      const icon = holder.querySelector("[data-lucide]");
      holder.replaceWith(
        icon ||
          Object.assign(document.createElement("i"), {
            dataset: {
              lucide: ICONS[fileOf(a.getAttribute("href"))] || "circle",
            },
          }),
      );
    }
    top.appendChild(clone);
  });
  topbar.insertBefore(top, topbar.firstChild);
}
function theme() {
  return document.documentElement.dataset.theme || "dark";
}
function applyTheme(next) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("proglog-theme", next);
  } catch (e) {}
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = next === "light" ? "#3D173E" : "#3D173E";
  const b = $("#themeToggle") || $("#landingTheme");
  if (b) {
    b.setAttribute(
      "aria-label",
      next === "light" ? "Switch to dark mode" : "Switch to light mode",
    );
    b.setAttribute(
      "title",
      next === "light" ? "Switch to dark mode" : "Switch to light mode",
    );
    b.innerHTML = `<i data-lucide="${next === "light" ? "moon" : "sun"}"></i>`;
    window.lucide?.createIcons();
  }
}
function ensureThemeToggle() {
  const actions = $(".top-actions");
  const landing = $(".landing-nav");
  let b = $("#themeToggle") || $("#landingTheme");
  if (!b && !actions && !landing) return;
  if (!b) {
    b = document.createElement("button");
    b.id = "themeToggle";
    b.className = "theme-toggle";
    b.type = "button";
    b.setAttribute("aria-label", "Switch to light mode");
    if (actions) actions.insertBefore(b, actions.firstChild);
    else {
      b.style.marginLeft = "auto";
      b.style.marginRight = "10px";
      landing.insertBefore(b, landing.lastElementChild);
    }
  }
  if (!b.dataset.bound) {
    b.dataset.bound = "1";
    b.addEventListener("click", () =>
      applyTheme(theme() === "light" ? "dark" : "light"),
    );
  }
  applyTheme(theme());
}
function ensureAccountAction() {
  const bottom = $(".sidebar-bottom");
  if (!bottom || $(".sign-out", bottom)) return;
  const b = document.createElement("button");
  b.className = "btn btn-ghost sign-out";
  b.type = "button";
  b.innerHTML = '<i data-lucide="log-out"></i><span>Sign out</span>';
  b.style.cssText =
    "width:100%;margin-top:12px;justify-content:flex-start;font-size:11px";
  bottom.appendChild(b);
}
function ensureCookieBanner() {
  let consent = null;
  try {
    consent = localStorage.getItem("proglog-cookie-consent");
  } catch (e) {}
  if (consent || $(".cookie-banner")) return;
  const banner = document.createElement("aside");
  banner.className = "cookie-banner";
  banner.setAttribute("role", "region");
  banner.setAttribute("aria-label", "Cookie and storage notice");
  banner.innerHTML = `<div class="cookie-copy"><strong>Privacy & storage</strong><p>progLog uses essential browser storage for your theme preference, sign-in state and site functionality. Game data may be stored in Firebase when you are signed in. <a href="${relPath()}pages/privacy.html">Learn more</a>.</p></div><div class="cookie-actions"><button type="button" class="btn btn-ghost" data-cookie="decline">Decline</button><button type="button" class="btn btn-primary" data-cookie="accept">Accept</button></div>`;
  document.body.appendChild(banner);
  banner.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cookie]");
    if (!b) return;
    try {
      localStorage.setItem("proglog-cookie-consent", b.dataset.cookie);
    } catch (err) {}
    banner.remove();
  });
}
export async function setupShell() {
  await loadLucide();
  normalizeIcons();
  ensureTopNav();
  ensureThemeToggle();
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
  ensureCookieBanner();
  ensureAccountAction();
  window.lucide?.createIcons();
}
export function setUser(user) {
  const names = $$(".user-name");
  const n = user?.displayName || user?.email?.split("@")[0] || "Guest";
  names.forEach((x) => (x.textContent = n));
  $$("[data-user-avatar]").forEach((x) => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("proglog-avatar") || "null",
      );
      const cfg = user?.avatar || saved;
      if (cfg) x.src = avatarData(cfg);
      else if (user?.photoURL) x.src = user.photoURL;
    } catch (e) {
      if (user?.photoURL) x.src = user.photoURL;
    }
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
