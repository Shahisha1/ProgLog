import { API_BASE } from "../api-config.js";
export const apiReady = Boolean(API_BASE && !API_BASE.includes("YOUR-PROGLOG"));
export async function api(path, options = {}) {
  if (!apiReady) throw new Error("The Cloudflare Worker URL is not configured yet. Set API_BASE in assets/js/api-config.js.");
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, { ...options, headers: { Accept: "application/json", ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API request failed (${res.status})`);
  return data;
}
const portraitCover = (url) => {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("media.rawg.io") && u.pathname.includes("/media/")) {
      u.pathname = u.pathname.replace(/\/media\/(games\/|crop\/\d+\/\d+\/)?/, "/media/crop/600/800/");
      return u.toString();
    }
  } catch {}
  return url;
};
export const rawgToGame = (g, local = {}) => ({
  ...local,
  rawgId: g.id ?? local.rawgId,
  name: g.name || local.name || "Untitled game",
  nameOriginal: g.name_original || local.nameOriginal || "",
  slug: g.slug || local.slug || "",
  coverUrl: portraitCover(g.background_image || g.coverUrl || local.coverUrl || ""),
  heroUrl: g.background_image_additional || g.background_image || g.heroUrl || local.heroUrl || "",
  released: g.released || local.released || "",
  tba: Boolean(g.tba),
  rating: g.rating ?? local.rating ?? 0,
  ratingTop: g.rating_top ?? local.ratingTop ?? 0,
  ratings: g.ratings || local.ratings || {},
  ratingsCount: g.ratings_count ?? local.ratingsCount ?? 0,
  reviewsTextCount: g.reviews_text_count ?? local.reviewsTextCount ?? 0,
  added: g.added ?? local.added ?? 0,
  addedByStatus: g.added_by_status || local.addedByStatus || {},
  metacritic: g.metacritic ?? local.metacritic ?? null,
  metacriticPlatforms: g.metacritic_platforms || local.metacriticPlatforms || [],
  playtime: g.playtime ?? local.playtime ?? 0,
  suggestionsCount: g.suggestions_count ?? local.suggestionsCount ?? 0,
  updated: g.updated || local.updated || "",
  esrb: g.esrb_rating || g.esrb || local.esrb || null,
  platforms: (g.platforms || local.platforms || []).map(x => x.platform || x),
  genres: g.genres || local.genres || [],
  tags: g.tags || local.tags || [],
  developers: g.developers || local.developers || [],
  publishers: g.publishers || local.publishers || [],
  creatorsCount: g.creators_count ?? local.creatorsCount ?? 0,
  screenshotsCount: g.screenshots_count ?? local.screenshotsCount ?? 0,
  moviesCount: g.movies_count ?? local.moviesCount ?? 0,
  achievementsCount: g.achievements_count ?? local.achievementsCount ?? 0,
  parentAchievementsCount: g.parent_achievements_count ?? local.parentAchievementsCount ?? 0,
  parentsCount: g.parents_count ?? local.parentsCount ?? 0,
  additionsCount: g.additions_count ?? local.additionsCount ?? 0,
  gameSeriesCount: g.game_series_count ?? local.gameSeriesCount ?? 0,
  website: g.website || local.website || "",
  redditUrl: g.reddit_url || local.redditUrl || "",
  redditName: g.reddit_name || local.redditName || "",
  redditDescription: g.reddit_description || local.redditDescription || "",
  redditLogo: g.reddit_logo || local.redditLogo || "",
  redditCount: g.reddit_count ?? local.redditCount ?? 0,
  twitchCount: g.twitch_count ?? local.twitchCount ?? 0,
  youtubeCount: g.youtube_count ?? local.youtubeCount ?? 0,
  alternativeNames: g.alternative_names || local.alternativeNames || [],
  metacriticUrl: g.metacritic_url || local.metacriticUrl || "",
  description: g.description_raw || local.description || "",
  shortScreenshots: g.short_screenshots || local.shortScreenshots || [],
  steamAppId: local.steamAppId ?? null,
  status: local.status || "backlog",
  favorite: Boolean(local.favorite),
  personalRating: local.personalRating ?? null,
  review: local.review || "",
  playtimeHours: Number(local.playtimeHours) || 0,
  completedAt: local.completedAt || null,
});
