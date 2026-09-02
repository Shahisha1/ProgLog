/* Proglog community content feeds.
 * Reddit works directly from its public JSON endpoint.
 * YouTube uses RSS-to-JSON for public channel feeds, avoiding a browser-exposed API key.
 * Twitch requires a small server-side proxy because Twitch Helix requires OAuth.
 */
(function () {
  'use strict';

  var CONFIG = window.proglogFeedConfig || {
    reddit: { subreddit: 'gaming', limit: 12 },
    youtube: {
      limitPerChannel: 5,
      channels: [
        { name: 'IGN', id: 'UCKy1dAqELo0zrOtPkf0eTMw' },
        { name: 'PlayStation', id: 'UC-2Y8dQb0S6DtpxNgAKoJKA' },
        { name: 'GameSpot', id: 'UCbu2SsF-Or3Rsn3NxqODImw' },
        { name: 'IGN Guides', id: 'UC4LKeEyIBI7kyntQMFXTh0Q' }
      ]
    },
    twitch: { proxyUrl: '' }
  };

  var esc = window.proglogApp && window.proglogApp.escapeHtml ? window.proglogApp.escapeHtml : function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c];
    });
  };

  function timeAgo(value) {
    var d = new Date(value).getTime();
    if (!d) return '';
    var sec = Math.max(0, Math.floor((Date.now() - d) / 1000));
    if (sec < 60) return sec + 's ago';
    if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
    if (sec < 604800) return Math.floor(sec / 86400) + 'd ago';
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function fetchJson(url, options, attempt) {
    attempt = attempt || 0;
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function(){ controller.abort(); }, 12000) : null;
    var opts = options || {}; opts.headers = opts.headers || { Accept: 'application/json' }; if (controller) opts.signal = controller.signal;
    return fetch(url, opts).then(function(r){ if(timer)clearTimeout(timer); if(r.ok)return r.json(); if((r.status===429||r.status>=500)&&attempt<2)return new Promise(function(res){setTimeout(res,500*Math.pow(2,attempt));}).then(function(){return fetchJson(url,options,attempt+1);}); throw new Error('HTTP '+r.status); }).catch(function(e){ if(timer)clearTimeout(timer); if(attempt<2&&(e.name==='AbortError'||/failed to fetch|network/i.test(e.message||'')))return new Promise(function(res){setTimeout(res,500*Math.pow(2,attempt));}).then(function(){return fetchJson(url,options,attempt+1);}); throw e; });
  }

  function setStatus(id, text, state) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.dataset.state = state || '';
  }

  function renderReddit(posts) {
    var root = document.getElementById('community-reddit-list');
    if (!root) return;
    root.innerHTML = posts.map(function (p) {
      var data = p.data || {};
      var thumb = data.thumbnail && /^https?:\/\//.test(data.thumbnail) ? data.thumbnail : '';
      return '<a class="feed-card reddit-card" href="https://www.reddit.com' + esc(data.permalink || '') + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="feed-thumb reddit-thumb">' + (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy">' : '<span>r/</span>') + '</div>' +
        '<div class="feed-copy"><div class="feed-kicker">r/' + esc(data.subreddit || 'gaming') + '</div><strong>' + esc(data.title || 'Reddit post') + '</strong><p>' + esc(data.selftext ? data.selftext.slice(0, 120) : (data.domain || 'Community post')) + '</p><small>' + timeAgo((data.created_utc || 0) * 1000) + ' · ' + Number(data.score || 0).toLocaleString() + ' points · ' + Number(data.num_comments || 0).toLocaleString() + ' comments</small></div>' +
        '</a>';
    }).join('');
  }

  function loadReddit() {
    setStatus('reddit-feed-status', 'Loading', 'loading');
    var sub = encodeURIComponent(CONFIG.reddit.subreddit || 'gaming');
    var direct = 'https://www.reddit.com/r/' + sub + '/hot.json?limit=' + Math.min(100, CONFIG.reddit.limit || 50) + '&raw_json=1';
    var proxy = CONFIG.reddit.proxyUrl ? CONFIG.reddit.proxyUrl + '?subreddit=' + sub + '&limit=' + Math.min(100, CONFIG.reddit.limit || 50) : '';
    return (proxy ? fetchJson(proxy) : Promise.reject(new Error('no proxy'))).catch(function(){ return fetchJson(direct); }).then(function (data) {
      var posts = data && data.data && data.data.children ? data.data.children.filter(function (x) { return x && x.data && !x.data.stickied; }) : [];
      renderReddit(posts);
      setStatus('reddit-feed-status', posts.length + ' posts', 'ready');
    }).catch(function () {
      var root = document.getElementById('community-reddit-list');
      if (root) root.innerHTML = '<div class="feed-empty"><strong>Reddit is temporarily unavailable.</strong><span>Open the gaming community directly to see the latest posts.</span><a href="https://www.reddit.com/r/gaming/" target="_blank" rel="noopener noreferrer">Open Reddit ↗</a></div>';
      setStatus('reddit-feed-status', 'Unavailable', 'error');
    });
  }

  function xmlText(node, tag) {
    var n = node.getElementsByTagName(tag)[0];
    return n ? (n.textContent || '') : '';
  }

  function loadYoutubeChannel(channel) {
    var serverProxy = CONFIG.youtube.proxyUrl ? CONFIG.youtube.proxyUrl + '?channel_id=' + encodeURIComponent(channel.id) + '&limit=' + (CONFIG.youtube.limitPerChannel || 10) : '';
    var rss = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + encodeURIComponent(channel.id);
    var rssProxy = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rss);
    return (serverProxy ? fetchJson(serverProxy) : Promise.reject(new Error('no server proxy'))).catch(function(){ return fetchJson(rssProxy); }).then(function (data) {
      var items = data.items || data.videos || [];
      return items.slice(0, CONFIG.youtube.limitPerChannel || 10).map(function (item) {
        var videoId = item.videoId || (item.guid ? item.guid.split(':').pop() : '');
        return {
          title: item.title || 'YouTube video',
          url: item.link || ('https://www.youtube.com/watch?v=' + videoId),
          image: item.thumbnail || (videoId ? 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg' : ''),
          channel: channel.name,
          published: item.pubDate,
          description: item.description || ''
        };
      });
    });
  }

  function renderYoutube(videos) {
    var root = document.getElementById('community-youtube-list');
    if (!root) return;
    videos.sort(function (a, b) { return new Date(b.published) - new Date(a.published); });
    root.innerHTML = videos.map(function (v) {
      return '<a class="feed-card youtube-card" href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="video-thumb"><img src="' + esc(v.image) + '" alt="" loading="lazy" onerror="this.src=\'https://i.ytimg.com/vi/' + encodeURIComponent(v.videoId || '') + '/hqdefault.jpg\'; this.onerror=function(){this.style.display=\'none\';}"><span class="play-mark">▶</span></div>' +
        '<div class="feed-copy"><div class="feed-kicker">YouTube · ' + esc(v.channel) + '</div><strong>' + esc(v.title) + '</strong><small>' + timeAgo(v.published) + '</small></div>' +
        '</a>';
    }).join('');
  }

  function loadYoutube() {
    setStatus('youtube-feed-status', 'Loading', 'loading');
    return Promise.all(CONFIG.youtube.channels.map(function (channel) { return loadYoutubeChannel(channel).catch(function () { return []; }); })).then(function (groups) {
      var videos = [].concat.apply([], groups);
      renderYoutube(videos);
      setStatus('youtube-feed-status', videos.length + ' videos', 'ready');
    }).catch(function () {
      var root = document.getElementById('community-youtube-list');
      if (root) root.innerHTML = '<div class="feed-empty"><strong>YouTube feed is temporarily unavailable.</strong><span>The channel links are still available below.</span><a href="https://www.youtube.com/gaming" target="_blank" rel="noopener noreferrer">Open YouTube Gaming ↗</a></div>';
      setStatus('youtube-feed-status', 'Unavailable', 'error');
    });
  }

  function renderTwitch(streams) {
    var root = document.getElementById('community-twitch-list');
    if (!root) return;
    root.innerHTML = streams.map(function (s) {
      return '<a class="feed-card twitch-card" href="' + esc(s.url || ('https://www.twitch.tv/' + s.user_login)) + '" target="_blank" rel="noopener noreferrer">' +
        '<div class="video-thumb"><img src="' + esc((s.thumbnail_url || '').replace('{width}', '640').replace('{height}', '360')) + '" alt="" loading="lazy"><span class="live-mark">LIVE</span></div>' +
        '<div class="feed-copy"><div class="feed-kicker">Twitch · ' + esc(s.game_name || 'Gaming') + '</div><strong>' + esc(s.title || 'Live stream') + '</strong><small>' + esc(s.user_name || s.user_login || '') + ' · ' + Number(s.viewer_count || 0).toLocaleString() + ' viewers</small></div>' +
        '</a>';
    }).join('');
  }

  function loadTwitch() {
    setStatus('twitch-feed-status', 'Loading', 'loading');
    var root = document.getElementById('community-twitch-list');
    if (!root) return;
    if (!CONFIG.twitch.proxyUrl) {
      root.innerHTML = '<div class="feed-empty"><strong>Twitch needs OAuth on the server.</strong><span>The static site cannot safely expose a Twitch client secret. Add a server-side proxy URL in <code>assets/js/content-feeds-config.js</code> to populate live streams automatically.</span><a href="https://www.twitch.tv/directory/category/gaming" target="_blank" rel="noopener noreferrer">Browse live gaming on Twitch ↗</a></div>';
      return;
    }
    return fetchJson(CONFIG.twitch.proxyUrl).then(function (data) {
      var streams = Array.isArray(data) ? data : (data.data || []);
      renderTwitch(streams);
      setStatus('twitch-feed-status', streams.length + ' live', 'ready');
    }).catch(function () {
      root.innerHTML = '<div class="feed-empty"><strong>Twitch could not be reached.</strong><span>Check the configured proxy endpoint.</span></div>';
    });
  }

  function init() {
    if (!document.getElementById('community-feed')) return;
    loadReddit();
    loadYoutube();
    loadTwitch();
    document.querySelectorAll('[data-feed-refresh]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-feed-refresh');
        btn.classList.add('is-spinning');
        var task = type === 'reddit' ? loadReddit() : (type === 'youtube' ? loadYoutube() : loadTwitch());
        Promise.resolve(task).finally(function () { btn.classList.remove('is-spinning'); });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
