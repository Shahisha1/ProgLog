// RAWG Games API adapter. Keeps the page tolerant when optional endpoints are unavailable.
export const RAWG_GAME_ENDPOINTS = {
  detail: (id) => `/games/${id}`,
  achievements: (id) => `/games/${id}/achievements?page_size=100`,
  screenshots: (id) => `/games/${id}/screenshots?page_size=40`,
  movies: (id) => `/games/${id}/movies?page_size=20`,
  stores: (id) => `/games/${id}/stores?page_size=20`,
  reddit: (id) => `/games/${id}/reddit?page_size=20`,
  developmentTeam: (id) => `/games/${id}/development-team?page_size=40`,
  series: (id) => `/games/${id}/game-series?page_size=30`,
  parents: (id) => `/games/${id}/parent-games?page_size=30`,
  suggested: (id) => `/games/${id}/suggested?page_size=20`,
  twitch: (id) => `/games/${id}/twitch?page_size=20`,
  youtube: (id) => `/games/${id}/youtube?page_size=20`,
};

export async function fetchRawgGameBundle(api, rawgId) {
  if (!rawgId) return {};
  const entries = Object.entries(RAWG_GAME_ENDPOINTS).filter(([key]) => key !== "detail");
  const results = await Promise.allSettled(entries.map(([, endpoint]) => api(endpoint(rawgId))));
  return entries.reduce((bundle, [key], index) => {
    const result = results[index];
    bundle[key] = result.status === "fulfilled" ? result.value : null;
    return bundle;
  }, {});
}

export const firstItems = (payload, limit = 8) => (payload?.results || []).slice(0, limit);
