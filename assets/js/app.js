import { configured, auth, db, googleProvider } from "./firebase.js";
import { API_BASE } from "./api-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ],
  );
const toast = (message, type = "success") => {
  let box = $("#flash");
  if (!box) return;
  box.className = `notice ${type}`;
  box.textContent = message;
  box.classList.remove("hidden");
  clearTimeout(window.__flash);
  window.__flash = setTimeout(() => box.classList.add("hidden"), 4200);
};
window.showToast = toast;

const isPage = (name) =>
  location.pathname.endsWith(`/${name}`) || location.pathname.endsWith(name);
const rootPath =
  isPage("index.html") || location.pathname.endsWith("/") ? "./" : "../";
const canonicalLink = $('link[rel="canonical"]');
if (canonicalLink)
  canonicalLink.href = `${location.origin}${location.pathname}`;
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

const avatarKey = "proglog.avatar.v1";
const applyAvatar = (source) => {
  if (!source) return;
  $$("[data-user-avatar]").forEach((image) => {
    image.src = source;
  });
};
applyAvatar(localStorage.getItem(avatarKey));

const avatarUpload = $("#avatarUpload");
const resetAvatar = $("#resetAvatar");
const compressAvatar = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const max = 512;
      const scale = Math.min(max / image.width, max / image.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(image.src);
      resolve(canvas.toDataURL("image/jpeg", 0.84));
    };
    image.onerror = () => reject(new Error("That image could not be read."));
    image.src = URL.createObjectURL(file);
  });

avatarUpload?.addEventListener("change", async () => {
  const file = avatarUpload.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/"))
    return toast("Choose an image file for your profile photo.", "error");
  if (file.size > 8 * 1024 * 1024)
    return toast("Choose an image smaller than 8 MB.", "error");
  try {
    const image = await compressAvatar(file);
    localStorage.setItem(avatarKey, image);
    applyAvatar(image);
    toast("Your profile photo was updated.");
  } catch (error) {
    toast(error.message || "Your profile photo could not be saved.", "error");
  } finally {
    avatarUpload.value = "";
  }
});

resetAvatar?.addEventListener("click", () => {
  localStorage.removeItem(avatarKey);
  $$("[data-user-avatar]").forEach((image) => image.removeAttribute("src"));
  location.reload();
});

const sidebar = $(".sidebar");
const menu = $("#menuButton");
if (menu && sidebar)
  menu.addEventListener("click", () => {
    const open = sidebar.classList.toggle("mobile-open");
    document.body.classList.toggle("menu-open", open);
    menu.setAttribute("aria-expanded", String(open));
  });
$$(".nav a").forEach((link) =>
  link.addEventListener("click", () => {
    sidebar?.classList.remove("mobile-open");
    document.body.classList.remove("menu-open");
    menu?.setAttribute("aria-expanded", "false");
  }),
);

const authLinks = $$(".auth-link");
const userNameEls = $$(".user-name");
const signOutButtons = $$(".sign-out");
const setAuthState = (user) => {
  userNameEls.forEach(
    (el) =>
      (el.textContent =
        user?.displayName || user?.email?.split("@")[0] || "Guest"),
  );
  authLinks.forEach((el) => {
    el.textContent = user ? "Account" : "Sign in";
    el.href = user
      ? `${rootPath}pages/profile.html`
      : `${rootPath}pages/auth.html`;
  });
  signOutButtons.forEach((el) => (el.hidden = !user));
};
if (configured && auth)
  onAuthStateChanged(auth, async (user) => {
    setAuthState(user);
    if (user) await syncProfile(user);
  });
else setAuthState(null);
signOutButtons.forEach((button) =>
  button.addEventListener("click", async () => {
    if (!auth)
      return toast("Firebase is not configured for local use yet.", "error");
    try {
      await signOut(auth);
      toast("You have been signed out.");
    } catch (error) {
      toast(error.message, "error");
    }
  }),
);

async function syncProfile(user) {
  if (!db) return;
  try {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists())
      await setDoc(
        ref,
        {
          displayName: user.displayName || user.email?.split("@")[0] || "Gamer",
          email: user.email || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
  } catch (error) {
    console.warn("Profile sync failed:", error.message);
  }
}

const authForm = $("#authForm");
if (authForm) {
  const modeInput = $("#authMode"),
    heading = $("#authHeading"),
    submit = $("#authSubmit"),
    switcher = $("#authSwitch"),
    google = $("#googleAuth");
  const updateMode = (mode) => {
    modeInput.value = mode;
    const signup = mode === "signup";
    heading.textContent = signup
      ? "Create your progLog account"
      : "Welcome back";
    submit.textContent = signup ? "Create account" : "Sign in";
    switcher.textContent = signup
      ? "Already have an account? Sign in"
      : "New to progLog? Create an account";
    $("#passwordConfirmField")?.classList.toggle("hidden", !signup);
  };
  updateMode("signin");
  switcher?.addEventListener("click", (e) => {
    e.preventDefault();
    updateMode(modeInput.value === "signin" ? "signup" : "signin");
  });
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!configured || !auth)
      return toast(
        "Firebase is not configured. Add the Web App config in firebase-config.js.",
        "error",
      );
    const email = $("#authEmail").value.trim(),
      password = $("#authPassword").value,
      confirm = $("#authPasswordConfirm")?.value;
    if (!email || password.length < 6)
      return toast(
        "Enter a valid email and a password with at least 6 characters.",
        "error",
      );
    if (modeInput.value === "signup" && password !== confirm)
      return toast("Passwords do not match.", "error");
    submit.disabled = true;
    try {
      if (modeInput.value === "signup")
        await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      toast(
        modeInput.value === "signup"
          ? "Account created successfully."
          : "Signed in successfully.",
      );
      setTimeout(() => (location.href = `${rootPath}index.html`), 500);
    } catch (error) {
      const message =
        error.code === "auth/invalid-credential"
          ? "Email or password is incorrect."
          : error.message;
      toast(
        message.replace("Firebase: ", "").replace(/ \(auth\/[^)]+\)\.?$/, ""),
        "error",
      );
    } finally {
      submit.disabled = false;
    }
  });
  google?.addEventListener("click", async () => {
    if (!configured || !auth)
      return toast(
        "Firebase is not configured. Add the Web App config first.",
        "error",
      );
    try {
      await signInWithPopup(auth, googleProvider);
      toast("Signed in with Google.");
      setTimeout(() => (location.href = `${rootPath}index.html`), 500);
    } catch (error) {
      toast(error.message.replace("Firebase: ", ""), "error");
    }
  });
}

const apiReady = API_BASE && !API_BASE.includes("YOUR-PROGLOG");
async function api(path) {
  if (!apiReady)
    throw new Error(
      "RAWG proxy is not configured yet. Set API_BASE in assets/js/api-config.js after deploying the Cloudflare Worker.",
    );
  const response = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, {
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(payload.error || `API request failed (${response.status})`);
  return payload;
}

const rawgToGame = (game) => ({
  rawgId: game.id,
  name: game.name,
  slug: game.slug || "",
  coverUrl: game.background_image || "",
  heroUrl: game.background_image || game.background_image_additional || "",
  released: game.released || "",
  rating: game.rating || 0,
  ratingsCount: game.ratings_count || 0,
  metacritic: game.metacritic || null,
  platforms: game.platforms || [],
  genres: game.genres || [],
  updatedAt: new Date().toISOString(),
});

const gameDocId = (game) => `rawg-${game.rawgId}`;
let savedGames = JSON.parse(localStorage.getItem("proglog.games.v2") || "[]");
async function loadFirestoreGames() {
  if (!auth?.currentUser || !db) return [];
  try {
    const snap = await getDocs(
      collection(db, "users", auth.currentUser.uid, "games"),
    );
    return snap.docs.map((gameDocument) => ({
      id: gameDocument.id,
      ...gameDocument.data(),
    }));
  } catch (error) {
    console.warn("Game library read failed:", error.message);
    return [];
  }
}

function gameCard(game) {
  const image = game.coverUrl;
  const href = `${rootPath}pages/game.html?id=${encodeURIComponent(game.rawgId || "")}&name=${encodeURIComponent(game.name)}`;
  const artwork = image
    ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(game.name)} game artwork" loading="lazy">`
    : '<div class="game-artwork-missing" aria-hidden="true">No RAWG artwork</div>';
  return `<a class="game" href="${href}">${artwork}<div class="game-info"><b>${escapeHTML(game.name)}</b><small>${game.rating ? `★ ${Number(game.rating).toFixed(1)}` : "Saved game"}${game.released ? ` · ${escapeHTML(game.released.slice(0, 4))}` : ""}</small></div></a>`;
}

async function renderLibrary() {
  const list = $("#library");
  if (!list) return;
  const defaults = [];
  const cloud = await loadFirestoreGames();
  const byId = new Map();
  [
    ...defaults,
    ...savedGames.map((name) =>
      typeof name === "string"
        ? { name, coverUrl: "" }
        : name,
    ),
    ...cloud,
  ].forEach((g) => byId.set(g.rawgId || `name-${g.name.toLowerCase()}`, g));
  const games = [...byId.values()];
  list.innerHTML = games.length
    ? games.map(gameCard).join("")
    : '<div class="api-state">Your library is empty. Search RAWG above to add your first game.</div>';
}
renderLibrary();

const gameSearchForm = $("#gameSearchForm");
const gameSearchInput = $("#gameSearchInput");
const gameSearchResults = $("#gameSearchResults");
const gameCatalog = $("#gameCatalog");
let latestResults = [];
let catalogGames = [];
let searchDelay;

const gameResults = (games, source) =>
  games
    .map(
      (game, index) =>
        `<article class="api-game-result">${game.background_image ? `<img src="${escapeHTML(game.background_image)}" alt="${escapeHTML(game.name)} artwork" loading="lazy">` : '<div class="game-artwork-missing" aria-hidden="true">No RAWG artwork</div>'}<div><h3>${escapeHTML(game.name)}</h3><p>${escapeHTML((game.platforms || []).slice(0, 4).join(" · ") || "Platform data unavailable")} ${game.released ? `· ${escapeHTML(game.released)}` : ""}</p><small>${game.rating ? `★ ${Number(game.rating).toFixed(1)}` : "No rating"}${game.metacritic ? ` · Metacritic ${game.metacritic}` : ""}</small></div><button class="btn btn-primary import-game" data-source="${source}" data-index="${index}" type="button">Add</button></article>`,
    )
    .join("");

async function findGames(query) {
  if (query.length < 2) {
    gameSearchResults.innerHTML = "";
    return;
  }
  gameSearchResults.innerHTML = '<div class="api-state">Searching RAWG…</div>';
  try {
    const searchResponse = await api(`/games?search=${encodeURIComponent(query)}`);
    latestResults = searchResponse.results || [];
    gameSearchResults.innerHTML = latestResults.length
      ? gameResults(latestResults, "search")
      : '<div class="api-state">No games found. Try another title.</div>';
  } catch (error) {
    gameSearchResults.innerHTML = `<div class="api-state error-state">${escapeHTML(error.message)}</div>`;
  }
}

async function loadCatalog() {
  if (!gameCatalog) return;
  gameCatalog.innerHTML = '<div class="api-state">Loading the RAWG catalogue…</div>';
  try {
    const catalogResponse = await api("/games");
    catalogGames = catalogResponse.results || [];
    gameCatalog.innerHTML = catalogGames.length
      ? gameResults(catalogGames, "catalog")
      : '<div class="api-state">No catalogue games are available right now.</div>';
  } catch (error) {
    gameCatalog.innerHTML = `<div class="api-state error-state">${escapeHTML(error.message)}</div>`;
  }
}
loadCatalog();

if (gameSearchForm) {
  gameSearchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = gameSearchInput.value.trim();
    if (query.length < 2) return toast("Enter at least 2 characters.", "error");
    findGames(query);
  });
  gameSearchInput.addEventListener("input", () => {
    clearTimeout(searchDelay);
    searchDelay = setTimeout(() => findGames(gameSearchInput.value.trim()), 280);
  });
}
[$("#gameSearchResults"), $("#gameCatalog")].filter(Boolean).forEach((container) => container.addEventListener("click", async (e) => {
  const button = e.target.closest(".import-game");
  if (!button) return;
  const games = button.dataset.source === "catalog" ? catalogGames : latestResults;
  const game = games[Number(button.dataset.index)];
  if (!game) return;
  button.disabled = true;
  button.textContent = "Adding…";
  const normalized = rawgToGame(game);
  try {
    if (auth?.currentUser && db)
      await setDoc(
        doc(db, "users", auth.currentUser.uid, "games", gameDocId(normalized)),
        { ...normalized, status: "saved", createdAt: serverTimestamp() },
        { merge: true },
      );
    savedGames = [
      ...savedGames.filter(
        (g) => (typeof g === "string" ? g : g.name) !== normalized.name,
      ),
      normalized,
    ];
    localStorage.setItem("proglog.games.v2", JSON.stringify(savedGames));
    button.textContent = "Added ✓";
    toast(`${normalized.name} was added to your library.`);
    renderLibrary();
  } catch (error) {
    button.disabled = false;
    button.textContent = "Add";
    toast(`Could not add ${normalized.name}: ${error.message}`, "error");
  }
}));

const saveGame = $("#saveGame");
if (saveGame)
  saveGame.addEventListener("click", () => {
    gameSearchInput?.focus();
    gameSearchInput?.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Search RAWG for a game, then press Add.");
  });

async function loadGameDetail() {
  const title = $("#gameName");
  if (!title) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const name = params.get("name") || "God of War";
  let game = null;
  try {
    if (id && /^\d+$/.test(id)) game = await api(`/games/${id}`);
    else {
      const searchPayload = await api(`/games?search=${encodeURIComponent(name)}`);
      game =
        (searchPayload.results || []).find(
          (g) => g.name.toLowerCase() === name.toLowerCase(),
        ) || searchPayload.results?.[0];
      if (game) game = await api(`/games/${game.id}`);
    }
  } catch (error) {
    console.warn("RAWG detail unavailable:", error.message);
  }
  if (!game) return;

  title.textContent = game.name;
  document.title = `${game.name} Achievement Tracker | progLog`;
  const meta = $('meta[name="description"]');
  if (meta)
    meta.content = `Track trophies, achievements, sessions, completion and playtime for ${game.name} on progLog.`;
  const cover = $(".hero .cover");
  if (cover && game.background_image) {
    cover.src = game.background_image;
    cover.alt = `${game.name} artwork`;
  }
  const art = $(".hero-art");
  if (art && game.background_image)
    art.style.backgroundImage = `url("${game.background_image}")`;
  const gameMeta = $(".hero .meta");
  if (gameMeta)
    gameMeta.textContent = `${(game.platforms || []).slice(0, 3).join(" · ") || "Game"} · ${(game.genres || []).slice(0, 2).join(" · ") || "Video game"}`;
  const rating = $(".hero .rating");
  if (rating)
    rating.innerHTML = `<strong>★ ${game.rating ? Number(game.rating).toFixed(1) : "—"}</strong> <span class="positive">RAWG rating</span> · ${game.ratings_count ? Number(game.ratings_count).toLocaleString() : "0"} ratings`;
  const desc = $("#gameDescription");
  if (desc)
    desc.innerHTML = escapeHTML(game.description_raw || "").replace(
      /\n/g,
      "<br>",
    );
  const screenshots = $("#gameScreenshots");
  const guideScreenshots = $("#guideScreenshots");
  const shots = game.short_screenshots || [];
  if (screenshots) {
    screenshots.innerHTML = shots.length
      ? shots
          .slice(0, 8)
          .map(
            (s) =>
              `<img src="${escapeHTML(s.image)}" alt="${escapeHTML(game.name)} gameplay screenshot" loading="lazy">`,
          )
          .join("")
      : '<div class="api-state">No screenshots available.</div>';
  }
  if (guideScreenshots)
    guideScreenshots.innerHTML = shots.length
      ? shots
          .slice(0, 3)
          .map(
            (shot, index) =>
              `<img src="${escapeHTML(shot.image)}" alt="${escapeHTML(game.name)} walkthrough screenshot ${index + 1}" loading="lazy">`,
          )
          .join("")
      : '<div class="api-state">RAWG has no walkthrough screenshots for this title.</div>';
  const save = $("#detailSave");
  save?.addEventListener(
    "click",
    async () => {
      const normalized = rawgToGame(game);
      try {
        if (auth?.currentUser && db)
          await setDoc(
            doc(
              db,
              "users",
              auth.currentUser.uid,
              "games",
              gameDocId(normalized),
            ),
            { ...normalized, status: "saved", updatedAt: serverTimestamp() },
            { merge: true },
          );
        savedGames = [
          ...savedGames.filter(
            (g) => (typeof g === "string" ? g : g.name) !== normalized.name,
          ),
          normalized,
        ];
        localStorage.setItem("proglog.games.v2", JSON.stringify(savedGames));
        save.textContent = "★ Saved";
        toast(`${game.name} is in your library.`);
      } catch (error) {
        toast(`Could not save ${game.name}: ${error.message}`, "error");
      }
    },
    { once: true },
  );

  const achievementList = $("#gameAchievements");
  if (achievementList) {
    try {
      const achievementPayload = await api(`/games/${game.id}/achievements`);
      const achievements = achievementPayload.results || [];
      achievementList.innerHTML = achievements.length
        ? achievements
            .slice(0, 12)
            .map(
              (a) =>
                `<div class="trophy"><div class="medal">🏆</div><b>${escapeHTML(a.name)}</b><small>${escapeHTML(a.description || "Achievement")}</small></div>`,
            )
            .join("")
        : '<div class="api-state">No achievement data returned by RAWG for this game.</div>';
    } catch {
      achievementList.innerHTML =
        '<div class="api-state">Achievement data is unavailable for this title.</div>';
    }
  }
}
loadGameDetail();

const settingsForm = $("#settingsForm");
if (settingsForm)
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const settingsValues = Object.fromEntries(new FormData(settingsForm));
    try {
      if (auth?.currentUser && db)
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            displayName: settingsValues.displayName?.trim() || "Gamer",
            visibility: settingsValues.visibility || "Public",
            activityVisible: Boolean(settingsValues.activityVisible),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      localStorage.setItem("proglog.settings", JSON.stringify(settingsValues));
      toast("Your settings were saved successfully.");
    } catch (error) {
      toast(`Settings could not be saved: ${error.message}`, "error");
    }
  });

const contactForm = $("#contactForm");
if (contactForm)
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(contactForm);
    if (!form.get("name") || !form.get("email") || !form.get("message"))
      return toast("Please complete all required fields.", "error");
    if (!configured || !auth?.currentUser || !db)
      return toast(
        "Please sign in to send this form, or email hello@proglog.app directly.",
        "error",
      );
    try {
      await addDoc(collection(db, "contactMessages"), {
        uid: auth.currentUser.uid,
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
        createdAt: serverTimestamp(),
      });
      location.href = `${rootPath}pages/thank-you.html`;
    } catch (error) {
      toast(`Your message could not be sent: ${error.message}`, "error");
    }
  });
