const { onRequest } = require('firebase-functions/v2/https');

let cachedToken = null;
let tokenExpiresAt = 0;
async function twitchToken(clientId, clientSecret) {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' });
  const r = await fetch('https://id.twitch.tv/oauth2/token', { method: 'POST', body });
  if (!r.ok) throw new Error('Twitch OAuth failed: ' + r.status);
  const data = await r.json(); cachedToken = data.access_token; tokenExpiresAt = Date.now() + Math.max(60, (data.expires_in || 3600) - 120) * 1000; return cachedToken;
}
function limit(v, fallback, max) { const n = Number(v || fallback); return Math.max(1, Math.min(max, Number.isFinite(n) ? n : fallback)); }

exports.rawg = onRequest({ cors: true }, async (req, res) => {
  try {
    const key = process.env.RAWG_API_KEY;
    if (!key) return res.status(503).json({ error: 'RAWG_API_KEY is not configured.' });
    const endpoint = String(req.query.endpoint || '');
    const allowed = /^\/games(?:\/[A-Za-z0-9_-]+)?(?:\/screenshots|\/achievements|\/youtube|\/suggested|\/game-series)?$/;
    if (!allowed.test(endpoint) || endpoint.includes('://') || endpoint.includes('..')) return res.status(400).json({ error: 'Invalid RAWG endpoint.' });
    const join = endpoint.includes('?') ? '&' : '?';
    const url = 'https://api.rawg.io/api' + endpoint + join + 'key=' + encodeURIComponent(key);
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await r.text();
    res.status(r.status).set('Cache-Control','public,max-age=300,s-maxage=300').type('application/json').send(body);
  } catch (e) { res.status(500).json({ error: e.message || 'RAWG request failed.' }); }
});

exports.tgdb = onRequest({ cors: true }, async (req, res) => {
  try {
    const key = process.env.THEGAMESDB_API_KEY;
    if (!key) return res.status(503).json({ error: 'THEGAMESDB_API_KEY is not configured.' });
    const endpoint = String(req.query.endpoint || '');
    const allowed = /^\/v1(?:\.1)?\/Games\/(?:ByGameName|ByGameID|ByPlatformID|Images|Videos)$/;
    if (!allowed.test(endpoint) || endpoint.includes('://') || endpoint.includes('..')) return res.status(400).json({ error: 'Invalid TheGamesDB endpoint.' });
    const join = endpoint.includes('?') ? '&' : '?';
    const url = 'https://api.thegamesdb.net' + endpoint + join + 'apikey=' + encodeURIComponent(key);
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await r.text();
    res.status(r.status).set('Cache-Control','public,max-age=300,s-maxage=300').type('application/json').send(body);
  } catch (e) { res.status(500).json({ error: e.message || 'TheGamesDB request failed.' }); }
});

exports.reddit = onRequest({ cors: true }, async (req, res) => {
  try {
    const subreddit = String(req.query.subreddit || 'gaming').replace(/[^A-Za-z0-9_+-]/g, '').slice(0, 40) || 'gaming';
    const first = limit(req.query.limit, 50, 100);
    const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/hot.json?limit=${first}&raw_json=1`;
    const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'ProgLog/1.0 community-feed' } });
    if (!r.ok) return res.status(r.status).json({ error: 'Reddit returned ' + r.status });
    const body = await r.json(); res.set('Cache-Control','public,max-age=60,s-maxage=60').json(body);
  } catch (e) { res.status(500).json({ error: e.message || 'Reddit request failed.' }); }
});

function tag(xml, name) { const m = xml.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>','i')); return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g,'').trim() : ''; }
function unescapeXml(s) { return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>'); }
function parseYoutubeFeed(xml, channel, max) {
  return (xml.match(/<entry>[\s\S]*?<\/entry>/gi) || []).slice(0,max).map(entry => {
    const id = unescapeXml(tag(entry,'yt:videoId') || tag(entry,'videoId'));
    const title = unescapeXml(tag(entry,'title'));
    const published = tag(entry,'published');
    return { videoId:id, title:title || 'YouTube video', url:id ? 'https://www.youtube.com/watch?v='+id : '', image:id ? 'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg' : '', channel:channel || '', published };
  }).filter(v => v.videoId);
}
exports.youtube = onRequest({ cors: true }, async (req, res) => {
  try {
    const channelId = String(req.query.channel_id || '').trim();
    if (!/^[A-Za-z0-9_-]{10,}$/.test(channelId)) return res.status(400).json({ error: 'Invalid channel_id.' });
    const max = limit(req.query.limit, 10, 15);
    const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + encodeURIComponent(channelId), { headers: { Accept: 'application/atom+xml,text/xml' } });
    if (!r.ok) return res.status(r.status).json({ error: 'YouTube RSS returned ' + r.status });
    const xml = await r.text();
    const videos = parseYoutubeFeed(xml, String(req.query.channel_name || ''), max);
    res.set('Cache-Control','public,max-age=120,s-maxage=120').json({ videos });
  } catch (e) { res.status(500).json({ error: e.message || 'YouTube request failed.' }); }
});

exports.twitchStreams = onRequest({ cors: true }, async (req, res) => {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID, clientSecret = process.env.TWITCH_CLIENT_SECRET;
    if (!clientId || !clientSecret) return res.status(503).json({ error: 'Twitch credentials are not configured.' });
    const token = await twitchToken(clientId, clientSecret);
    const params = new URLSearchParams({ first: String(limit(req.query.first, 100, 100)), language: String(req.query.language || 'en') });
    if (req.query.game_id) params.set('game_id', String(req.query.game_id));
    const r = await fetch('https://api.twitch.tv/helix/streams?' + params, { headers: { 'Client-ID': clientId, Authorization: 'Bearer ' + token } });
    const data = await r.json(); if (!r.ok) return res.status(r.status).json(data); res.set('Cache-Control','public,max-age=30,s-maxage=30').json(data);
  } catch (err) { res.status(500).json({ error: err.message || 'Twitch request failed.' }); }
});
