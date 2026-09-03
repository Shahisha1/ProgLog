const CACHE_TTL = 60 * 60;
const RATE_WINDOW = 60_000,
  RATE_MAX = 60;
const hits = new Map();
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      ...extra,
    },
  });
}
function cors(h = "*") {
  return {
    "access-control-allow-origin": h,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Content-Type, Accept",
  };
}
async function fetchJSON(url, headers = {}, cacheKey) {
  const req = new Request(url, { headers });
  if (cacheKey) {
    const c = caches.default;
    const hit = await c.match(req);
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok) await c.put(req, r.clone());
    return r;
  }
  return fetch(req);
}
function limited(ip) {
  const now = Date.now();
  const x = hits.get(ip) || { n: 0, t: now };
  if (now - x.t > RATE_WINDOW) {
    x.n = 0;
    x.t = now;
  }
  x.n++;
  hits.set(ip, x);
  if (hits.size > 3000 && Math.random() < 0.05)
    hits.delete(hits.keys().next().value);
  return x.n <= RATE_MAX;
}
function rawgBase(env) {
  return `https://api.rawg.io/api`;
}
async function rawg(path, env) {
  if (!env.RAWG_API_KEY)
    throw new Error("RAWG_API_KEY secret is missing on the Worker");
  const url = new URL(`${rawgBase(env)}${path}`);
  url.searchParams.set("key", env.RAWG_API_KEY);
  return fetchJSON(url.toString(), { accept: "application/json" }, true);
}
async function steam(path, env, params) {
  if (!env.STEAM_API_KEY) return null;
  const u = new URL(`https://api.steampowered.com${path}`);
  Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v));
  u.searchParams.set("key", env.STEAM_API_KEY);
  return fetchJSON(u.toString(), { accept: "application/json" }, true);
}
async function handle(req, env) {
  const u = new URL(req.url);
  const p = u.pathname.replace(/\/$/, "");
  if (p === "/health")
    return json(
      {
        ok: true,
        service: "progLog API proxy",
        time: new Date().toISOString(),
      },
      200,
      cors(),
    );
  if (p === "/games") {
    const allowed = [
      "search",
      "ordering",
      "page",
      "page_size",
      "platforms",
      "dates",
      "genres",
    ];
    const q = new URLSearchParams();
    allowed.forEach((k) => {
      const v = u.searchParams.get(k);
      if (v) q.set(k, v);
    });
    const r = await rawg(`/games?${q.toString()}`, env);
    const d = await r.json();
    return json(d, r.status, cors());
  }
  const gm = p.match(/^\/games\/(\d+)$/);
  if (gm) {
    const r = await rawg(`/games/${gm[1]}`, env);
    const d = await r.json();
    return json(d, r.status, cors());
  }
  const ga = p.match(/^\/games\/(\d+)\/achievements$/);
  if (ga) {
    const r = await rawg(`/games/${ga[1]}/achievements`, env);
    const d = await r.json();
    return json(d, r.status, cors());
  }
  if (p === "/steam/resolve") {
    if (!env.STEAM_API_KEY)
      return json(
        {
          available: false,
          error: "Steam integration is optional and is not configured.",
        },
        503,
        cors(),
      );
    const vanity = u.searchParams.get("vanity");
    if (!vanity) return json({ error: "vanity is required" }, 400, cors());
    const r = await steam("/ISteamUser/ResolveVanityURL/v1/", env, {
      vanityurl: vanity,
    });
    const d = await r.json();
    return json(d, r.status, cors());
  }
  if (p === "/steam/player") {
    if (!env.STEAM_API_KEY)
      return json(
        {
          available: false,
          error: "Steam integration is optional and is not configured.",
        },
        503,
        cors(),
      );
    const steamid = u.searchParams.get("steamid");
    if (!steamid) return json({ error: "steamid is required" }, 400, cors());
    const r = await steam("/ISteamUser/GetPlayerSummaries/v2/", env, {
      steamids: steamid,
    });
    const d = await r.json();
    return json(d, r.status, cors());
  }
  if (p === "/steam/owned") {
    if (!env.STEAM_API_KEY)
      return json(
        {
          available: false,
          error: "Steam integration is optional and is not configured.",
        },
        503,
        cors(),
      );
    const steamid = u.searchParams.get("steamid");
    if (!steamid) return json({ error: "steamid is required" }, 400, cors());
    const r = await steam("/IPlayerService/GetOwnedGames/v0001/", env, {
      steamid,
      include_appinfo: "true",
      include_played_free_games: "true",
      format: "json",
    });
    const d = await r.json();
    return json(d, r.status, cors());
  }
  if (p === "/steam/recent") {
    if (!env.STEAM_API_KEY)
      return json(
        {
          available: false,
          error: "Steam integration is optional and is not configured.",
        },
        503,
        cors(),
      );
    const steamid = u.searchParams.get("steamid");
    if (!steamid) return json({ error: "steamid is required" }, 400, cors());
    const r = await steam(
      "/IPlayerService/GetRecentlyPlayedGames/v0001/",
      env,
      { steamid, count: "20", format: "json" },
    );
    const d = await r.json();
    return json(d, r.status, cors());
  }
  if (p === "/steam/schema") {
    if (!env.STEAM_API_KEY)
      return json(
        {
          available: false,
          error: "Steam integration is optional and is not configured.",
        },
        503,
        cors(),
      );
    const appid = u.searchParams.get("appid");
    if (!appid) return json({ error: "appid is required" }, 400, cors());
    const r = await steam("/ISteamUserStats/GetSchemaForGame/v2/", env, {
      appid,
      format: "json",
    });
    const d = await r.json();
    return json(d, r.status, cors());
  }
  if (p === "/steam/achievements") {
    if (!env.STEAM_API_KEY)
      return json(
        {
          available: false,
          error: "Steam integration is optional and is not configured.",
        },
        503,
        cors(),
      );
    const steamid = u.searchParams.get("steamid"),
      appid = u.searchParams.get("appid");
    if (!steamid || !appid)
      return json({ error: "steamid and appid are required" }, 400, cors());
    const r = await steam("/ISteamUserStats/GetPlayerAchievements/v1/", env, {
      steamid,
      appid,
      l: "english",
      format: "json",
    });
    const d = await r.json();
    return json(d, r.status, cors());
  }
  return json({ error: "Not found" }, 404, cors());
}
export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors() });
    if (req.method !== "GET")
      return json({ error: "Method not allowed" }, 405, cors());
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (!limited(ip))
      return json(
        { error: "Rate limit exceeded. Try again in a minute." },
        429,
        cors(),
      );
    try {
      return await handle(req, env);
    } catch (e) {
      return json({ error: e.message || "Worker error" }, 500, cors());
    }
  },
};
