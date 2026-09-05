const RATE_WINDOW = 60_000;
const RATE_MAX = 60;
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

function cors(origin = "*") {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Content-Type, Accept",
  };
}

function limited(ip) {
  const now = Date.now();
  const entry = hits.get(ip) || { n: 0, t: now };
  if (now - entry.t > RATE_WINDOW) {
    entry.n = 0;
    entry.t = now;
  }
  entry.n += 1;
  hits.set(ip, entry);
  if (hits.size > 3000 && Math.random() < 0.05) {
    hits.delete(hits.keys().next().value);
  }
  return entry.n <= RATE_MAX;
}

async function fetchJSON(url) {
  const request = new Request(url, { headers: { accept: "application/json" } });
  const cached = await caches.default.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await caches.default.put(request, response.clone());
  }
  return response;
}

async function rawg(path, env, searchParams = new URLSearchParams()) {
  if (!env.RAWG_API_KEY) {
    throw new Error("RAWG_API_KEY secret is missing on the Worker");
  }
  const url = new URL(`https://api.rawg.io/api${path}`);
  for (const [key, value] of searchParams.entries()) {
    if (key !== "key") url.searchParams.set(key, value);
  }
  url.searchParams.set("key", env.RAWG_API_KEY);
  return fetchJSON(url.toString());
}

async function steam(path, env, params = {}) {
  if (!env.STEAM_API_KEY) return null;
  const url = new URL(`https://api.steampowered.com${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("key", env.STEAM_API_KEY);
  return fetchJSON(url.toString());
}

async function proxyRawg(req, env, upstreamPath) {
  const response = await rawg(upstreamPath, env, new URL(req.url).searchParams);
  const body = await response.json().catch(() => ({}));
  return json(body, response.status, cors());
}

async function handle(req, env) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (path === "/health") {
    return json({ ok: true, service: "progLog API proxy", time: new Date().toISOString() }, 200, cors());
  }

  if (path === "/games") {
    return proxyRawg(req, env, "/games");
  }

  const gameMatch = path.match(/^\/games\/(\d+)$/);
  if (gameMatch) {
    return proxyRawg(req, env, `/games/${gameMatch[1]}`);
  }

  // RAWG Games API sub-resources used by progLog.
  // Keeping this list explicit prevents the Worker from becoming an arbitrary URL proxy.
  const subResourceMatch = path.match(
    /^\/games\/(\d+)\/(achievements|screenshots|movies|stores|reddit|development-team|game-series|parent-games|suggested|twitch|youtube)$/,
  );
  if (subResourceMatch) {
    return proxyRawg(req, env, `/games/${subResourceMatch[1]}/${subResourceMatch[2]}`);
  }

  if (path === "/steam/resolve") {
    if (!env.STEAM_API_KEY) {
      return json({ available: false, error: "Steam integration is optional and is not configured." }, 503, cors());
    }
    const vanity = url.searchParams.get("vanity");
    if (!vanity) return json({ error: "vanity is required" }, 400, cors());
    const response = await steam("/ISteamUser/ResolveVanityURL/v1/", env, { vanityurl: vanity });
    const body = await response.json().catch(() => ({}));
    return json(body, response.status, cors());
  }

  if (path === "/steam/player") {
    if (!env.STEAM_API_KEY) {
      return json({ available: false, error: "Steam integration is optional and is not configured." }, 503, cors());
    }
    const steamid = url.searchParams.get("steamid");
    if (!steamid) return json({ error: "steamid is required" }, 400, cors());
    const response = await steam("/ISteamUser/GetPlayerSummaries/v2/", env, { steamids: steamid });
    const body = await response.json().catch(() => ({}));
    return json(body, response.status, cors());
  }

  if (path === "/steam/owned") {
    if (!env.STEAM_API_KEY) {
      return json({ available: false, error: "Steam integration is optional and is not configured." }, 503, cors());
    }
    const steamid = url.searchParams.get("steamid");
    if (!steamid) return json({ error: "steamid is required" }, 400, cors());
    const response = await steam("/IPlayerService/GetOwnedGames/v0001/", env, {
      steamid,
      include_appinfo: "true",
      include_played_free_games: "true",
      format: "json",
    });
    const body = await response.json().catch(() => ({}));
    return json(body, response.status, cors());
  }

  if (path === "/steam/recent") {
    if (!env.STEAM_API_KEY) {
      return json({ available: false, error: "Steam integration is optional and is not configured." }, 503, cors());
    }
    const steamid = url.searchParams.get("steamid");
    if (!steamid) return json({ error: "steamid is required" }, 400, cors());
    const response = await steam("/IPlayerService/GetRecentlyPlayedGames/v0001/", env, {
      steamid,
      count: "20",
      format: "json",
    });
    const body = await response.json().catch(() => ({}));
    return json(body, response.status, cors());
  }

  if (path === "/steam/schema") {
    if (!env.STEAM_API_KEY) {
      return json({ available: false, error: "Steam integration is optional and is not configured." }, 503, cors());
    }
    const appid = url.searchParams.get("appid");
    if (!appid) return json({ error: "appid is required" }, 400, cors());
    const response = await steam("/ISteamUserStats/GetSchemaForGame/v2/", env, { appid, format: "json" });
    const body = await response.json().catch(() => ({}));
    return json(body, response.status, cors());
  }

  if (path === "/steam/achievements") {
    if (!env.STEAM_API_KEY) {
      return json({ available: false, error: "Steam integration is optional and is not configured." }, 503, cors());
    }
    const steamid = url.searchParams.get("steamid");
    const appid = url.searchParams.get("appid");
    if (!steamid || !appid) return json({ error: "steamid and appid are required" }, 400, cors());
    const response = await steam("/ISteamUserStats/GetPlayerAchievements/v1/", env, {
      steamid,
      appid,
      l: "english",
      format: "json",
    });
    const body = await response.json().catch(() => ({}));
    return json(body, response.status, cors());
  }

  return json({ error: "Not found" }, 404, cors());
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }
    if (req.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, cors());
    }
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (!limited(ip)) {
      return json({ error: "Rate limit exceeded. Try again in a minute." }, 429, cors());
    }
    try {
      return await handle(req, env);
    } catch (error) {
      return json({ error: error?.message || "Worker error" }, 500, cors());
    }
  },
};
