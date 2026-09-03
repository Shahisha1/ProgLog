const RAWG_BASE = "https://api.rawg.io/api";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(
  payload,
  status = 200,
  cache = "public, max-age=300, s-maxage=1800",
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache,
      ...corsHeaders(),
    },
  });
}

function cleanSearch(searchTerm) {
  return searchTerm
    .trim()
    .replace(/[\u0000-\u001F]/g, "")
    .slice(0, 80);
}

async function rawgFetch(target, env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(target, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(target, {
    headers: { Accept: "application/json" },
  });
  if (!upstream.ok)
    return json(
      { error: "RAWG request failed", status: upstream.status },
      upstream.status,
      "no-store",
    );

  const body = await upstream.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return json({ error: "RAWG returned invalid JSON." }, 502, "no-store");
  }

  const response = json(parsed);
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: corsHeaders() });
    if (request.method !== "GET")
      return json({ error: "Method not allowed" }, 405, "no-store");
    if (!env.RAWG_API_KEY)
      return json(
        { error: "RAWG_API_KEY secret is not configured on this Worker." },
        500,
        "no-store",
      );

    if (url.pathname === "/health")
      return json({ ok: true, service: "progLog RAWG proxy" }, 200, "no-store");

    if (url.pathname === "/games") {
      const search = cleanSearch(url.searchParams.get("search") || "");
      if (search && search.length < 2)
        return json(
          { error: "Search must contain at least 2 characters." },
          400,
          "no-store",
        );
      const params = new URLSearchParams({
        key: env.RAWG_API_KEY,
        page_size: "12",
        ordering: "-added",
      });
      if (search) {
        params.set("search", search);
        params.set("search_precise", "true");
      }
      const response = await rawgFetch(
        `${RAWG_BASE}/games?${params}`,
        env,
        ctx,
      );
      if (!response.ok) return response;
      const rawgPayload = await response.json();
      return json({
        count: rawgPayload.count || 0,
        results: (rawgPayload.results || []).map((game) => ({
          id: game.id,
          name: game.name,
          slug: game.slug,
          released: game.released,
          background_image: game.background_image,
          background_image_additional: game.background_image_additional,
          rating: game.rating,
          ratings_count: game.ratings_count,
          metacritic: game.metacritic,
          platforms: (game.platforms || [])
            .map((p) => p.platform?.name)
            .filter(Boolean),
          genres: (game.genres || []).map((g) => g.name).filter(Boolean),
        })),
      });
    }

    const match = url.pathname.match(
      /^\/games\/(\d+)(?:\/(achievements|screenshots))?$/,
    );
    if (!match) return json({ error: "Not found" }, 404, "no-store");
    const id = match[1];
    const child = match[2];
    const params = new URLSearchParams({ key: env.RAWG_API_KEY });
    if (child === "achievements") params.set("page_size", "100");
    return rawgFetch(
      `${RAWG_BASE}/games/${id}${child ? `/${child}` : ""}?${params}`,
      env,
      ctx,
    );
  },
};
