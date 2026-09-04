import { API_BASE } from "../api-config.js";
export const apiReady = Boolean(API_BASE && !API_BASE.includes("YOUR-PROGLOG"));
export async function api(path, options = {}) {
  if (!apiReady)
    throw new Error(
      "The Cloudflare Worker URL is not configured yet. Set API_BASE in assets/js/api-config.js.",
    );
  const res = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.error || `API request failed (${res.status})`);
  return data;
}
export const rawgToGame = (g) => ({
  rawgId: g.id,
  name: g.name || "Untitled game",
  slug: g.slug || "",
  coverUrl: g.background_image || "",
  heroUrl: g.background_image_additional || g.background_image || "",
  released: g.released || "",
  rating: g.rating || 0,
  ratingsCount: g.ratings_count || 0,
  metacritic: g.metacritic ?? null,
  platforms: (g.platforms || []).map((x) => x.platform || x),
  genres: g.genres || [],
  developers: g.developers || [],
  publishers: g.publishers || [],
  description: g.description_raw || "",
  shortScreenshots: g.short_screenshots || [],
  steamAppId: null,
  status: "backlog",
  favorite: false,
  personalRating: null,
  review: "",
  playtimeHours: 0,
  completedAt: null,
});
