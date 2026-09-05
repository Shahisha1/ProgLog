import { api, rawgToGame } from "./api.js";
import { getGame, saveGame, saveSession, addActivity } from "./store.js";
import { $, esc, fmtHours, showToast } from "./core.js";

const LABELS = {
  0.5: "Not for me", 1: "Not for me", 1.5: "Weak", 2: "Okay",
  2.5: "Getting there", 3: "Worth playing", 3.5: "Good",
  4: "Really good", 4.5: "Excellent", 5: "Loved it",
};
let selectedRating = 0;

const EP = {
  achievements: id => `/games/${id}/achievements?page_size=100`,
  additions: id => `/games/${id}/additions?page_size=20`,
  screenshots: id => `/games/${id}/screenshots?page_size=40`,
  movies: id => `/games/${id}/movies?page_size=20`,
  stores: id => `/games/${id}/stores?page_size=20`,
  reddit: id => `/games/${id}/reddit?page_size=20`,
  developmentTeam: id => `/games/${id}/development-team?page_size=40`,
  series: id => `/games/${id}/game-series?page_size=30`,
  parents: id => `/games/${id}/parent-games?page_size=30`,
  suggested: id => `/games/${id}/suggested?page_size=20`,
  twitch: id => `/games/${id}/twitch?page_size=20`,
  youtube: id => `/games/${id}/youtube?page_size=20`,
};

function setupStars(value = 0) {
  const box = $("#starRating");
  if (!box) return;

  selectedRating = Number(value) || 0;
  box.innerHTML = [1, 2, 3, 4, 5].map(n =>
    `<button type="button" class="star" data-star="${n}" aria-label="Rate ${n} or ${n - 0.5} stars"><span class="star-base">★</span><span class="star-fill">★</span></button>`
  ).join("");

  const paint = rating => {
    box.querySelectorAll(".star").forEach(star => {
      const n = Number(star.dataset.star);
      const fill = star.querySelector(".star-fill");
      if (fill) fill.style.width = `${Math.max(0, Math.min(100, (rating - n + 1) * 100))}%`;
    });
  };

  box.querySelectorAll(".star").forEach(star => {
    const getRating = event => {
      const rect = star.getBoundingClientRect();
      return Number(star.dataset.star) - (event.clientX - rect.left < rect.width / 2 ? 0.5 : 0);
    };
    star.addEventListener("pointerenter", event => paint(getRating(event)));
    star.addEventListener("pointermove", event => paint(getRating(event)));
    star.addEventListener("pointerleave", () => paint(selectedRating));
    star.addEventListener("click", event => {
      selectedRating = getRating(event);
      paint(selectedRating);
      const hint = $("#ratingHint");
      if (hint) hint.textContent = `${selectedRating}/5 — ${LABELS[selectedRating] || "Rated"}`;
    });
  });

  paint(selectedRating);
  const hint = $("#ratingHint");
  if (hint) hint.textContent = selectedRating
    ? `${selectedRating}/5 — ${LABELS[selectedRating] || "Rated"}`
    : "Choose a rating from 0.5 to 5";
}

const achievementPercent = game => {
  const achievements = game.achievements || [];
  return achievements.length
    ? Math.round(achievements.filter(item => item.unlocked).length / achievements.length * 100)
    : 0;
};

const progress = game =>
  game.status === "completed" ? 100 :
  game.status === "playing" ? Math.max(10, achievementPercent(game)) :
  game.status === "dropped" ? achievementPercent(game) : 0;

function renderProgress(game) {
  const percent = progress(game);
  const ring = $("#progressRing");
  if (ring) {
    ring.style.setProperty("--progress", `${percent}%`);
    ring.setAttribute("aria-label", `${percent}% progress`);
  }
  if ($("#progressPercent")) $("#progressPercent").textContent = `${percent}%`;
  if ($("#progressStatus")) {
    $("#progressStatus").textContent = {
      completed: "Completed",
      playing: "In progress",
      dropped: "Dropped",
      backlog: "Backlog",
      wishlist: "Wishlist",
    }[game.status] || "Backlog";
  }
}

function portrait(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("media.rawg.io")) {
      parsed.pathname = parsed.pathname.replace(
        /\/media\/(games\/|crop\/\d+\/\d+\/)?/,
        "/media/crop/600/800/"
      );
      return parsed.toString();
    }
  } catch {}
  return url;
}

function setCover(game) {
  const image = $("#gameCover");
  if (!image) return;

  const sources = [...new Set([
    portrait(game.coverUrl),
    game.coverUrl,
    game.heroUrl,
    ...(game.shortScreenshots || []).map(item => item.image),
  ].filter(Boolean))];

  let index = 0;
  image.onerror = () => {
    index += 1;
    if (index < sources.length) image.src = sources[index];
    else image.removeAttribute("src");
  };

  if (sources.length) image.src = sources[0];
  image.alt = `${game.name} cover`;
}

function renderScreenshots(game) {
  const box = $("#gameScreenshots");
  if (!box) return;

  const screenshots = [...new Map(
    (game.shortScreenshots || [])
      .filter(item => item?.image)
      .map(item => [item.image, item])
  ).values()].slice(0, 20);

  box.innerHTML = screenshots.length
    ? screenshots.map((item, index) => `
      <a class="rawg-screenshot" href="${esc(item.image)}" target="_blank" rel="noopener">
        <img
          src="${esc(item.image)}"
          alt="${esc(game.name)} screenshot ${index + 1}"
          loading="lazy"
          onerror="this.onerror=null;this.closest('.rawg-screenshot').remove();"
        >
        <span>Open full size</span>
      </a>
    `).join("")
    : `<div class="api-state">No RAWG screenshots are available.</div>`;
}

const first = payload => (payload?.results || []).slice(0, 12);
const names = payload => (payload || []).map(item => item.name || item.title).filter(Boolean);

function normalizeAchievements(remote, current = []) {
  const previous = new Map((current || []).map(item => [String(item.id), item]));
  return (remote || []).map(item => {
    const saved = previous.get(String(item.id));
    return {
      id: item.id,
      name: item.name || saved?.name || "Achievement",
      displayName: item.name || saved?.displayName || "Achievement",
      description: item.description || saved?.description || "",
      image: item.image || saved?.image || "",
      percent: item.percent ?? saved?.percent ?? null,
      unlocked: Boolean(saved?.unlocked),
    };
  });
}

function renderAchievements(game) {
  const box = $("#gameAchievements");
  if (!box) return;

  const achievements = game.achievements || [];
  box.innerHTML = achievements.length
    ? achievements.slice(0, 12).map(item => `
      <div class="achievement ${item.unlocked ? "" : "locked"}">
        <img
          src="${esc(item.image || "../assets/images/achievement-placeholder.svg")}" 
          alt=""
          loading="lazy"
          onerror="this.onerror=null;this.src='../assets/images/achievement-placeholder.svg'"
        >
        <div>
          <strong>${esc(item.name || item.displayName || "Achievement")}</strong>
          <small>${esc(item.description || "")}</small>
        </div>
      </div>
    `).join("")
    : `<div class="api-state">No RAWG achievement data.</div>`;
}

function renderBundle(bundle, game) {
  const meta = $("#rawgMeta");
  if (meta) {
    meta.innerHTML = [
      ["RAWG rating", game.rating ? Number(game.rating).toFixed(1) : "—"],
      ["Ratings", game.ratingsCount ? Number(game.ratingsCount).toLocaleString() : "—"],
      ["Average playtime", game.playtime ? `${game.playtime}h` : "—"],
      ["Metacritic", game.metacritic ?? "—"],
      ["Screenshots", game.screenshotsCount || first(bundle.screenshots).length || "—"],
      ["Movies", game.moviesCount || first(bundle.movies).length || "—"],
      ["Achievements", game.achievementsCount || game.achievements?.length || "—"],
      ["ESRB", game.esrb?.name || game.esrb || "Not rated"],
    ].map(([label, value]) =>
      `<div class="rawg-meta-item"><span>${label}</span><strong>${esc(String(value))}</strong></div>`
    ).join("");
  }

  const creators = $("#rawgCreators");
  if (creators) {
    const team = first(bundle.developmentTeam);
    creators.innerHTML = `
      <div class="section-head"><h3>Development team</h3><span class="link">${team.length}</span></div>
      <div class="rawg-chips">
        ${names(team).slice(0, 16).map(name => `<span class="rawg-chip">${esc(name)}</span>`).join("") ||
        `<span class="rawg-muted">Creator data unavailable.</span>`}
      </div>`;
  }

  const relatedBox = $("#rawgRelated");
  if (relatedBox) {
    const related = [...first(bundle.series), ...first(bundle.parents), ...first(bundle.suggested)]
      .filter(item => item?.name);
    relatedBox.innerHTML = `
      <div class="section-head"><h3>Related games</h3><span class="link">series · editions · similar</span></div>
      <div class="rawg-list">
        ${related.slice(0, 12).map(item =>
          `<a href="../pages/game.html?rawgId=${encodeURIComponent(item.id)}">
            <img src="${esc(item.background_image || game.coverUrl || "")}" alt="" loading="lazy" onerror="this.closest('a').remove()">
            <div><strong>${esc(item.name)}</strong><span>${esc(item.released || "")}</span></div>
          </a>`
        ).join("") || `<span class="rawg-muted">No related games returned.</span>`}
      </div>`;
  }

  const storesBox = $("#rawgStores");
  if (storesBox) {
    const stores = first(bundle.stores);
    storesBox.innerHTML = `
      <div class="section-head"><h3>Where to play</h3><span class="link">${stores.length} links</span></div>
      <div class="rawg-chips">
        ${stores.map(item =>
          `<a class="rawg-chip" href="${esc(item.url || "#")}" target="_blank" rel="noopener">${esc(item.store?.name || "Store")}</a>`
        ).join("") || `<span class="rawg-muted">No store links available.</span>`}
      </div>`;
  }

  const communityBox = $("#rawgCommunity");
  if (communityBox) {
    const reddit = first(bundle.reddit);
    const youtube = first(bundle.youtube);
    const twitch = first(bundle.twitch);

    communityBox.innerHTML = `
      <div class="section-head"><h3>Community & video</h3><span class="link">RAWG feeds</span></div>
      ${reddit.slice(0, 3).map(item =>
        `<article class="rawg-post"><a href="${esc(item.url || game.redditUrl || "#")}" target="_blank" rel="noopener">${esc(item.name || item.title || "Reddit post")}</a><p>${esc(item.text || item.description || "")}</p></article>`
      ).join("")}
      ${youtube.slice(0, 3).map(item => {
        const url = item.url || (item.external_id ? `https://www.youtube.com/watch?v=${item.external_id}` : "#");
        return `<article class="rawg-post"><a href="${esc(url)}" target="_blank" rel="noopener">YouTube</a><p>${esc(item.name || item.title || "")}</p></article>`;
      }).join("")}
      ${twitch.slice(0, 2).map(item =>
        `<article class="rawg-post"><a href="${esc(item.url || "#")}" target="_blank" rel="noopener">Twitch</a><p>${esc(item.name || "")}</p></article>`
      ).join("")}
      ${!reddit.length && !youtube.length && !twitch.length
        ? `<span class="rawg-muted">Optional community feeds are unavailable for this title or API plan.</span>`
        : ""}`;
  }

  const trailers = $("#gameTrailers");
  if (trailers) {
    const movies = first(bundle.movies);
    trailers.innerHTML = movies.map(item => {
      const src = item.data?.max || item.data?.["720"] || item.data?.["480"] || item.preview;
      return src
        ? `<article class="rawg-trailer">
            <video controls preload="metadata" poster="${esc(item.image || "")}" src="${esc(src)}"></video>
            <div class="rawg-trailer-copy"><strong>${esc(item.name || "Gameplay video")}</strong></div>
          </article>`
        : "";
    }).join("");
  }
}

async function bundle(id) {
  const entries = Object.entries(EP);
  const results = await Promise.allSettled(entries.map(([, endpoint]) => api(endpoint(id))));
  return results.reduce((output, result, index) => {
    output[entries[index][0]] = result.status === "fulfilled" ? result.value : null;
    return output;
  }, {});
}

export async function initGame() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const rawgId = params.get("rawgId");
  const name = params.get("name") || "";
  let game = null;

  if (id) game = await getGame(id);

  if (!game && rawgId) {
    try {
      const data = await api(`/games/${rawgId}`);
      game = rawgToGame(data, { id: `rawg-${data.id}` });
    } catch {}
  }

  if (!game && name) {
    try {
      const results = await api(`/games?search=${encodeURIComponent(name)}&page_size=1`);
      if (results.results?.[0]) {
        const data = await api(`/games/${results.results[0].id}`);
        game = rawgToGame(data, { id: `rawg-${data.id}` });
      }
    } catch {}
  }

  if (!game) {
    const page = $("#gamePage");
    if (page) page.innerHTML = '<div class="empty">This game could not be loaded.</div>';
    return;
  }

  const local = { ...game };

  try {
    const detail = await api(`/games/${game.rawgId}`);
    game = rawgToGame(detail, local);

    const data = await bundle(game.rawgId);
    if (Array.isArray(data.achievements?.results)) {
      game.achievements = normalizeAchievements(data.achievements.results, game.achievements);
    }
    if (Array.isArray(data.screenshots?.results)) {
      game.shortScreenshots = data.screenshots.results.filter(item => item?.image);
    }

    await saveGame(game);
    render(game, data);
  } catch (error) {
    console.warn("Game detail enrichment failed", error);
    render(game, {});
  }

  $("#saveStatus")?.addEventListener("change", async event => {
    const oldStatus = game.status || "backlog";
    game.status = event.target.value;
    game.completedAt = game.status === "completed"
      ? new Date().toISOString()
      : oldStatus === "completed" ? null : game.completedAt;

    await saveGame(game);
    await addActivity("status_change", `${game.name} moved to ${game.status}`, {
      gameId: game.id, from: oldStatus, to: game.status,
    });
    renderProgress(game);
    showToast(game.status === "completed" ? "Completed — progress is now 100%." : "Game status updated.");
  });

  $("#favoriteGame")?.addEventListener("click", async () => {
    game.favorite = !game.favorite;
    await saveGame(game);
    showToast(game.favorite ? "Added to favorites." : "Removed from favorites.");
  });

  $("#reviewForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    game.personalRating = selectedRating || null;
    game.review = $("#personalReview")?.value.trim() || "";
    await saveGame(game);
    await addActivity("review", `Reviewed ${game.name}`, {
      gameId: game.id, rating: game.personalRating,
    });
    showToast("Your review was saved.");
  });

  $("#sessionForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const minutes = Math.max(1, Number($("#sessionDuration")?.value) || 1);
    await saveSession({
      gameId: game.id,
      gameName: game.name,
      date: $("#sessionDate")?.value || new Date().toISOString().slice(0, 16),
      durationMinutes: minutes,
      note: $("#sessionNote")?.value.trim() || "",
    });
    game.playtimeHours = (Number(game.playtimeHours) || 0) + minutes / 60;
    await saveGame(game);
    if ($("#playtime")) $("#playtime").textContent = fmtHours(game.playtimeHours);
    if ($("#progressHours")) $("#progressHours").textContent = fmtHours(game.playtimeHours);
    showToast("Session logged.");
  });
}

function render(game, bundleData = {}) {
  document.title = `${game.name} | progLog`;

  $("#gameName").textContent = game.name;
  $("#gameMeta").textContent =
    `${(game.platforms || []).slice(0, 4).map(item => item.platform?.name || item.name || item).join(" · ") || "Game"}${game.released ? ` · ${game.released}` : ""}`;

  $("#gameRating").innerHTML =
    `<strong>${game.rating ? Number(game.rating).toFixed(1) : "—"}</strong>
     <span class="positive">RAWG</span>
     ${game.ratingsCount ? ` · ${Number(game.ratingsCount).toLocaleString()} ratings` : ""}
     ${game.metacritic ? ` · Metacritic ${game.metacritic}` : ""}`;

  setCover(game);

  const hero = $("#gameHero");
  if (hero && (game.heroUrl || game.coverUrl)) {
    hero.style.backgroundImage = `url("${game.heroUrl || game.coverUrl}")`;
  }

  $("#gameDescription").innerHTML =
    esc(game.description || "No description available.").replace(/\n/g, "<br>");
  $("#saveStatus").value = game.status || "backlog";
  $("#personalReview").value = game.review || "";

  setupStars(game.personalRating || 0);

  $("#playtime").textContent = fmtHours(game.playtimeHours || 0);

  const achievements = game.achievements || [];
  const unlocked = achievements.filter(item => item.unlocked).length;
  $("#achievementCount").textContent = `${unlocked}/${achievements.length}`;
  $("#gameReleased").textContent = game.released || "—";
  $("#gamePlatforms").textContent =
    (game.platforms || []).slice(0, 2).map(item => item.platform?.name || item.name || item).join(", ") || "—";

  $("#progressHours").textContent = fmtHours(game.playtimeHours || 0);
  $("#progressAchievements").textContent = `${unlocked}/${achievements.length}`;
  renderProgress(game);

  $("#gameTags").innerHTML =
    [...(game.genres || []), ...(game.tags || [])].slice(0, 6)
      .map(tag => `<span class="game-tag">${esc(tag.name || tag)}</span>`)
      .join("");

  renderAchievements(game);
  renderScreenshots(game);
  renderBundle(bundleData, game);

  $("#gameDevelopers").textContent = names(game.developers).join(", ") || "—";
  $("#gamePublishers").textContent = names(game.publishers).join(", ") || "—";
  $("#gameEsrb").textContent = game.esrb?.name || game.esrb || "Not rated";
  $("#gameWebsite").innerHTML = game.website
    ? `<a href="${esc(game.website)}" target="_blank" rel="noopener">Official website</a>`
    : "—";
}
