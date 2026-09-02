// ProgLog RAWG client — resilient search, retries, caching and media fallbacks.
(function () {
  'use strict';

  var requestQueue = {};
  var memoryCache = {};
  var REQUEST_TIMEOUT = 12000;
  var MAX_RETRIES = 2;

  function getConfig() {
    return window.rawgConfig || { baseUrl: 'https://api.rawg.io/api', apiKey: '', cacheExpiry: 86400000, proxyUrl: '/api/rawg' };
  }
  function cacheKey(kind, value) { return 'rawg_v4_' + kind + '_' + String(value || '').toLowerCase().replace(/\W+/g, '_'); }
  function getCached(key) {
    try {
      if (memoryCache[key] && memoryCache[key].expires > Date.now()) return memoryCache[key].value;
      var item = localStorage.getItem(key);
      if (!item) return null;
      var data = JSON.parse(item);
      if (data.expires && data.expires < Date.now()) { localStorage.removeItem(key); return null; }
      memoryCache[key] = data;
      return data.value;
    } catch (e) { return null; }
  }
  function setCached(key, value) {
    try {
      var data = { value: value, expires: Date.now() + Number(getConfig().cacheExpiry || 86400000) };
      memoryCache[key] = data;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function fetchWithTimeout(url, options, attempt) {
    attempt = attempt || 0;
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT) : null;
    var opts = options || {};
    if (controller) opts.signal = controller.signal;
    return fetch(url, opts).then(function (response) {
      if (timer) clearTimeout(timer);
      if (response.ok) return response.json();
      var retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      if (retryable && attempt < MAX_RETRIES) return sleep(500 * Math.pow(2, attempt)).then(function () { return fetchWithTimeout(url, options, attempt + 1); });
      return response.json().catch(function () { return {}; }).then(function (body) { throw new Error('API error: ' + response.status + (body && body.detail ? ' — ' + body.detail : '')); });
    }).catch(function (error) {
      if (timer) clearTimeout(timer);
      if (attempt < MAX_RETRIES && (error.name === 'AbortError' || /network|failed to fetch/i.test(error.message || ''))) {
        return sleep(500 * Math.pow(2, attempt)).then(function () { return fetchWithTimeout(url, options, attempt + 1); });
      }
      throw error;
    });
  }
  function proxyUrl(endpoint) {
    var cfg = getConfig();
    if (!cfg.proxyUrl) return '';
    return cfg.proxyUrl + (cfg.proxyUrl.indexOf('?') > -1 ? '&' : '?') + 'endpoint=' + encodeURIComponent(endpoint);
  }
  function directUrl(endpoint) {
    var cfg = getConfig();
    return cfg.baseUrl + endpoint + (endpoint.indexOf('?') > -1 ? '&' : '?') + 'key=' + encodeURIComponent(cfg.apiKey || '');
  }
  function fetchAPI(endpoint, callback) {
    var cfg = getConfig();
    var p = cfg.proxyUrl ? fetchWithTimeout(proxyUrl(endpoint), { headers: { Accept: 'application/json' } }).catch(function () {
      if (!cfg.apiKey) throw new Error('RAWG proxy unavailable and no client API key is configured.');
      return fetchWithTimeout(directUrl(endpoint), { headers: { Accept: 'application/json' } });
    }) : fetchWithTimeout(directUrl(endpoint), { headers: { Accept: 'application/json' } });
    p.then(function (data) { callback && callback(data, null); }).catch(function (error) { callback && callback(null, error); });
  }
  function normalizeTitle(title) {
    return String(title || '').toLowerCase().replace(/[™®©]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function searchVariants(title) {
    var original = String(title || '').trim();
    var normalized = normalizeTitle(original);
    var stripped = normalized.replace(/\b(edition|deluxe|ultimate|complete|goty|game of the year|remastered|remake|definitive|director s cut|collection)\b/g, ' ').replace(/\s+/g, ' ').trim();
    var variants = [original];
    if (stripped && stripped !== normalized && stripped.length >= 3) variants.push(stripped);
    return variants.filter(function (v, i, a) { return v && a.indexOf(v) === i; });
  }
  function scoreGameMatch(query, game) {
    var q = normalizeTitle(query), n = normalizeTitle(game && game.name);
    if (!q || !n) return -99999;
    if (q === n) return 10000;
    var qWords = q.split(' '), nWords = n.split(' ');
    var matched = qWords.filter(function (w) { return nWords.indexOf(w) >= 0; }).length;
    var coverage = matched / Math.max(1, qWords.length);
    var prefix = n.indexOf(q) === 0 || q.indexOf(n) === 0 ? 1200 : 0;
    var distance = Math.abs(q.length - n.length);
    var rating = Number(game.rating || 0) * 20;
    return coverage * 5000 + prefix - distance * 2 + rating;
  }
  function platformNames(game) {
    var values = [];
    (game && game.platforms || []).forEach(function (p) {
      var n = p && (p.platform ? p.platform.name : p.name);
      if (n) values.push(normalizeTitle(n));
    });
    return values;
  }
  function scoreResolvedGame(query, game, preferredPlatform) {
    var score = scoreGameMatch(query, game);
    var q = normalizeTitle(query), n = normalizeTitle(game && game.name);
    var platforms = platformNames(game);
    if (preferredPlatform && platforms.length) {
      var pp = normalizeTitle(preferredPlatform);
      if (platforms.some(function (x) { return x === pp || x.indexOf(pp) >= 0 || pp.indexOf(x) >= 0; })) score += 900;
    }
    if (game && game.background_image) score += 120;
    if (game && game.released) score += 10;
    if (q && n && q === n) score += 2500;
    return score;
  }
  function resolveGame(query, options, callback) {
    options = options || {};
    var preferredPlatform = options.platform || options.preferredPlatform || '';
    searchGames(query, function (results, error) {
      if (error && !results.length) return callback && callback(null, error);
      var candidates = (results || []).slice(0, 12);
      if (!candidates.length) return callback && callback(null, new Error('No RAWG game matched "' + query + '".'));
      var detailed = [], pending = candidates.length;
      candidates.forEach(function (candidate) {
        getGameDetails(candidate.id, function (details) {
          var merged = Object.assign({}, candidate, details || {});
          merged._matchScore = scoreResolvedGame(query, merged, preferredPlatform);
          detailed.push(merged);
          pending -= 1;
          if (!pending) {
            detailed.sort(function (a, b) { return b._matchScore - a._matchScore; });
            var best = detailed[0];
            if (!best || !best.id) return callback && callback(null, new Error('RAWG returned no usable game record.'));
            callback && callback(best, null, detailed);
          }
        });
      });
    });
  }
  function mapSearchResults(data) {
    return (data && data.results ? data.results : []).map(function (game) {
      return { id: game.id, name: game.name, background_image: game.background_image || game.background_image_additional || '', background_image_additional: game.background_image_additional || '', platforms: (game.platforms || []).map(function (p) { return p.platform && p.platform.name; }).filter(Boolean), released: game.released, rating: game.rating, metacritic: game.metacritic };
    }).filter(function (g) { return g.id && g.name; });
  }
  function searchGames(query, callback) {
    var safeQuery = String(query || '').trim();
    if (!safeQuery) return callback && callback([], null);
    var key = cacheKey('search', safeQuery), cached = getCached(key);
    if (cached) return callback && callback(cached, null);
    if (requestQueue[safeQuery]) { requestQueue[safeQuery].push(callback || function () {}); return; }
    requestQueue[safeQuery] = [callback || function () {}];
    var variants = searchVariants(safeQuery), collected = [], hadError = null;
    function finish(results, error) {
      var cbs = requestQueue[safeQuery] || []; delete requestQueue[safeQuery];
      if (results && results.length) setCached(key, results);
      cbs.forEach(function (cb) { cb && cb(results || [], error || null); });
    }
    function next(i) {
      if (i >= variants.length) {
        collected.sort(function (a,b) { return scoreGameMatch(safeQuery,b) - scoreGameMatch(safeQuery,a); });
        return finish(collected.slice(0, 20), hadError && !collected.length ? hadError : null);
      }
      var q = variants[i];
      fetchAPI('/games?search=' + encodeURIComponent(q) + '&search_exact=true&search_precise=true&page_size=20', function (data, error) {
        if (error) hadError = error;
        var results = mapSearchResults(data);
        if (!results.length) {
          return fetchAPI('/games?search=' + encodeURIComponent(q) + '&page_size=20&ordering=-rating', function (broad, broadError) {
            if (broadError) hadError = broadError;
            collected = collected.concat(mapSearchResults(broad));
            next(i + 1);
          });
        }
        collected = collected.concat(results);
        next(i + 1);
      });
    }
    next(0);
  }
  function getGameDetails(gameId, callback) {
    var key = cacheKey('details', gameId), cached = getCached(key);
    if (cached) return callback && callback(cached, null);
    fetchAPI('/games/' + encodeURIComponent(gameId), function (data, error) {
      if (!data) return callback && callback(null, error);
      var details = {
        id:data.id,name:data.name,description:data.description_raw || data.description,released:data.released,rating:data.rating,rating_top:data.rating_top,metacritic:data.metacritic,playtime:data.playtime,
        genres:(data.genres||[]).map(function(g){return g.name;}),platforms:(data.platforms||[]).map(function(p){return p.platform&&p.platform.name;}).filter(Boolean),developers:(data.developers||[]).map(function(d){return d.name;}),publishers:(data.publishers||[]).map(function(p){return p.name;}),esrb_rating:data.esrb_rating?data.esrb_rating.name:null,stores:(data.stores||[]).map(function(s){return{name:s.store&&s.store.name,url:s.url||''};}),background_image:data.background_image || data.background_image_additional || '',background_image_additional:data.background_image_additional || '',screenshots_count:data.screenshots_count,reddit_url:data.reddit_url,twitch_count:data.twitch_count,youtube_count:data.youtube_count
      };
      setCached(key, details); callback && callback(details, null);
    });
  }
  function getGameScreenshots(gameId, callback) {
    var key=cacheKey('screenshots',gameId),cached=getCached(key); if(cached)return callback&&callback(cached,null);
    fetchAPI('/games/'+encodeURIComponent(gameId)+'/screenshots?page_size=8',function(data,error){
      if(data&&data.results){var r=data.results.map(function(s){return{image:s.image,id:s.id};}).filter(function(s){return !!s.image;});setCached(key,r);return callback&&callback(r,null);} callback&&callback([],error);
    });
  }
  function getGameAchievements(gameId, callback) {
    var key = cacheKey('achievements', gameId), cached = getCached(key);
    if (cached) return callback && callback(cached, null);
    var all = [];
    var page = 1;
    var maxPages = 20;
    function loadPage() {
      fetchAPI('/games/' + encodeURIComponent(gameId) + '/achievements?page=' + page + '&page_size=40', function (data, error) {
        if (error) return callback && callback(all, error);
        var results = Array.isArray(data) ? data : ((data && data.results) || []);
        all = all.concat(results.map(function (a) {
          return {
            id: a.id,
            name: a.name || 'Achievement',
            description: a.description || '',
            image: a.image || '',
            percent: a.percent != null ? Number(a.percent) : null
          };
        }).filter(function (a) { return a.id != null && a.name; }));
        var hasNext = data && data.next;
        if (hasNext && page < maxPages && results.length) { page += 1; return loadPage(); }
        setCached(key, all);
        callback && callback(all, null);
      });
    }
    loadPage();
  }
  function getGameVideos(gameId, callback) {
    var key=cacheKey('videos',gameId),cached=getCached(key); if(cached)return callback&&callback(cached,null);
    fetchAPI('/games/'+encodeURIComponent(gameId)+'/youtube?page_size=20',function(data,error){
      if(data&&data.results){var r=data.results.map(function(v){var id=v.external_id||'';var thumb=v.thumbnails&&((v.thumbnails.maxres&&v.thumbnails.maxres.url)||(v.thumbnails.high&&v.thumbnails.high.url))||v.thumbnail|| (id?'https://i.ytimg.com/vi/'+encodeURIComponent(id)+'/hqdefault.jpg':'');return{id:v.id||id,name:v.name||'YouTube video',channel:v.channel_title||'',image:thumb,videoId:id,url:v.url|| (id?'https://www.youtube.com/watch?v='+encodeURIComponent(id):'')};}).filter(function(v){return v.videoId||v.image;});setCached(key,r);return callback&&callback(r,null);} callback&&callback([],error);
    });
  }
  function getSimilarGames(gameId, callback) {
    var key=cacheKey('similar',gameId),cached=getCached(key); if(cached)return callback&&callback(cached,null);
    fetchAPI('/games/'+encodeURIComponent(gameId)+'/suggested?page_size=8',function(data,error){if(data&&data.results){var r=data.results.map(function(g){return{id:g.id,name:g.name,background_image:g.background_image||'',rating:g.rating};});setCached(key,r);return callback&&callback(r,null);}callback&&callback([],error);});
  }
  function getGameSeries(gameId, callback) {
    var key=cacheKey('series',gameId),cached=getCached(key); if(cached)return callback&&callback(cached,null);
    fetchAPI('/games/'+encodeURIComponent(gameId)+'/game-series?page_size=10',function(data,error){if(data&&data.results){var r=data.results.map(function(g){return{id:g.id,name:g.name,released:g.released,background_image:g.background_image||''};});setCached(key,r);return callback&&callback(r,null);}callback&&callback([],error);});
  }
  window.rawgClient={searchGames:searchGames,resolveGame:resolveGame,getGameDetails:getGameDetails,getGameScreenshots:getGameScreenshots,getGameVideos:getGameVideos,getGameAchievements:getGameAchievements,getSimilarGames:getSimilarGames,getGameSeries:getGameSeries,getCached:getCached};
})();
