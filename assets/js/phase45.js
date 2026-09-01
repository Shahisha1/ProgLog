// Product polish layer
(function () {
  'use strict';
  var APP_VERSION = '5.0.0';
  function safe(fn, fallback) { try { return fn() } catch (e) { return fallback } }
  function session() { return safe(function () { return window.getCurrentSession ? window.getCurrentSession() : null }, null) }
  function cabinet() { var s = session(); return safe(function () { return s && window.getCabinetData ? window.getCabinetData(s.username) : null }, null) || { profile: {}, games: [], sessions: [], friends: [] } }
  function esc(v) { return safe(function () { return window.esc ? window.esc(v) : String(v ?? '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] }) }, '') }
  function games() { var c = cabinet(); return Array.isArray(c.games) ? c.games : [] }
  function details() { return safe(function () { return typeof GAME_DETAILS !== 'undefined' ? GAME_DETAILS : {} }, {}) }
  function allGames() {
    var out = []; var seen = {};
    games().forEach(function (g) { var id = String(g.id); seen[id] = 1; out.push({ id: id, title: g.title || id, platform: g.platform || 'other', kind: 'vault', game: g }); });
    Object.keys(details()).forEach(function (id) { if (seen[id]) return; var d = details()[id]; out.push({ id: id, title: d.title || id, platform: d.platform || 'other', kind: 'catalog', game: d }); });
    return out;
  }
  function resultHref(item) { return item.kind === 'vault' ? (window.pgRoute ? window.pgRoute('game', { id: item.id }) : '../../pages/games/game.html#' + encodeURIComponent(item.id)) : (window.pgRoute ? window.pgRoute('game', { id: item.id }) : '../../pages/games/game.html#' + encodeURIComponent(item.id)) }
  function installSearch() {
    if (document.getElementById('pg-command')) return;
    var wrap = document.createElement('div'); wrap.id = 'pg-command'; wrap.className = 'pg-command hidden';
    wrap.innerHTML = '<div class="pg-command-backdrop" data-command-close></div><section class="pg-command-panel" role="dialog" aria-modal="true" aria-labelledby="pg-command-title"><div class="pg-command-head"><div><span class="pg-kicker">QUICK SEARCH</span><h2 id="pg-command-title">Find something in Proglog</h2></div><button class="pg-icon-button" data-command-close aria-label="Close search">×</button></div><label class="pg-command-input"><span>⌕</span><input id="pg-command-query" type="search" autocomplete="off" placeholder="Search games, trophies, profiles…"><kbd>Esc</kbd></label><div id="pg-command-results" class="pg-command-results"></div><p class="pg-command-hint">Press <kbd>/</kbd> or <kbd>Ctrl K</kbd> anytime to search.</p></section>';
    document.body.appendChild(wrap);
    var input = wrap.querySelector('#pg-command-query'), list = wrap.querySelector('#pg-command-results');
    function close() { wrap.classList.add('hidden'); document.body.classList.remove('command-open') }
    function open() { wrap.classList.remove('hidden'); document.body.classList.add('command-open'); setTimeout(function () { input.focus(); input.select() }, 30); render('') }
    function render(q) {
      q = String(q || '').trim().toLowerCase(); var rows = [];
      allGames().filter(function (x) { return !q || x.title.toLowerCase().includes(q) || x.platform.toLowerCase().includes(q) }).slice(0, 8).forEach(function (x) { rows.push('<a class="pg-command-row" href="' + esc(resultHref(x)) + '"><span class="pg-command-icon">' + (x.platform === 'playstation' ? '♜' : '◈') + '</span><span><strong>' + esc(x.title) + '</strong><small>' + esc(x.platform) + ' · ' + (x.kind === 'vault' ? 'In your vault' : 'Catalog') + '</small></span><span class="pg-command-arrow">↗</span></a>') });
      var profs = safe(function () { return window.getProfiles ? window.getProfiles() : [] }, []); profs.filter(function (x) { return !q || String(x.username || '').toLowerCase().includes(q) }).slice(0, 4).forEach(function (x) { rows.push('<a class="pg-command-row" href="' + esc(window.pgRoute ? window.pgRoute('profile') : '../../pages/user/profile.html') + '"><span class="pg-command-icon">◎</span><span><strong>' + esc(x.username || 'Hunter') + '</strong><small>Profile</small></span><span class="pg-command-arrow">↗</span></a>') }); var c = cabinet(); var trophies = []; (c.games || []).forEach(function (g) { (g.achievements || []).forEach(function (a) { if (!q || String(a.name || '').toLowerCase().includes(q) || String(g.title || '').toLowerCase().includes(q)) trophies.push({ a: a, g: g }) }) });
      trophies.slice(0, 6).forEach(function (x) { rows.push('<a class="pg-command-row" href="' + esc(resultHref({ id: x.g.id, kind: 'vault' })) + '"><span class="pg-command-icon">♕</span><span><strong>' + esc(x.a.name || 'Untitled trophy') + '</strong><small>' + esc(x.g.title || 'Game') + ' · ' + (x.a.unlocked ? 'Unlocked' : 'Locked') + '</small></span><span class="pg-command-arrow">↗</span></a>') });
      list.innerHTML = rows.join('') || '<div class="pg-command-empty">No matches. Try another title.</div>';
    }
    wrap.addEventListener('click', function (e) { if (e.target.closest('[data-command-close]')) close() });
    input.addEventListener('input', function () { render(input.value) });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !wrap.classList.contains('hidden')) close(); if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); open() } });
    window.pgOpenSearch = open;
    var trigger = document.createElement('button'); trigger.className = 'pg-global-search'; trigger.type = 'button'; trigger.innerHTML = '<span>⌕</span><span>Search</span><kbd>/</kbd>'; trigger.setAttribute('aria-label', 'Search Proglog'); trigger.addEventListener('click', open); document.body.appendChild(trigger);
  }
  function installNotifications() {
    if (document.getElementById('pg-notify')) return;
    var c = cabinet(), items = [];
    (c.games || []).forEach(function (g) { (g.achievements || []).filter(function (a) { return a.unlocked }).forEach(function (a) { items.push({ time: a.unlockedAt || 0, title: a.name || 'Trophy unlocked', copy: g.title || 'Game', icon: '♕' }) }) });
    (c.sessions || []).forEach(function (s) { items.push({ time: s.startedAt || 0, title: 'Session logged', copy: s.gameTitle || 'Game', icon: '◷' }) });
    items.sort(function (a, b) { return b.time - a.time });
    var button = document.createElement('button'); button.id = 'pg-notify'; button.className = 'pg-notify'; button.type = 'button'; button.setAttribute('aria-label', 'Open recent activity'); button.innerHTML = '<span>◌</span><i>' + Math.min(items.length, 9) + '</i>'; document.body.appendChild(button);
    var panel = document.createElement('div'); panel.id = 'pg-notify-panel'; panel.className = 'pg-notify-panel hidden'; panel.innerHTML = '<div class="pg-notify-head"><strong>Recent activity</strong><button aria-label="Close">×</button></div><div class="pg-notify-list"></div>';
    panel.querySelector('.pg-notify-list').innerHTML = items.slice(0, 8).map(function (x) { return '<div class="pg-notify-row"><span>' + x.icon + '</span><div><strong>' + esc(x.title) + '</strong><small>' + esc(x.copy) + '</small></div></div>' }).join('') || '<div class="pg-command-empty">Nothing new yet.</div>';
    document.body.appendChild(panel); button.addEventListener('click', function () { panel.classList.toggle('hidden') }); panel.querySelector('button').addEventListener('click', function () { panel.classList.add('hidden') });
  }
  function installErrorBoundary() {
    if (document.getElementById('pg-error')) return;
    function show(message) { if (document.getElementById('pg-error')) return; var d = document.createElement('div'); d.id = 'pg-error'; d.className = 'pg-error-toast'; d.innerHTML = '<strong>Something went wrong</strong><span>' + esc(message || 'The page hit an unexpected error. Your saved data was not changed.') + '</span><button>Dismiss</button>'; d.querySelector('button').onclick = function () { d.remove() }; document.body.appendChild(d); setTimeout(function () { if (d.parentNode) d.remove() }, 8000) }
    window.addEventListener('error', function (e) { console.error(e.error || e.message); show('The page hit an unexpected error. Try refreshing if something looks wrong.') });
    window.addEventListener('unhandledrejection', function (e) { console.error(e.reason); show('A background action failed. Your local data is still available.') });
  }
  function registerPWA() { if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', function () { navigator.serviceWorker.register((window.pgRoute ? window.pgRoute('home') : './') + 'sw.js').catch(function (e) { console.debug('PWA unavailable', e) }) }) }
  function injectA11y() { document.querySelectorAll('img:not([loading])').forEach(function (i) { i.loading = 'lazy'; i.decoding = 'async' }); document.querySelectorAll('button,a').forEach(function (el) { if (!el.getAttribute('aria-label') && el.textContent.trim() === '×') el.setAttribute('aria-label', 'Close') }); }
  function init() { var appPage = document.body && document.body.classList.contains('has-global-sidebar'); if (appPage) { installSearch(); installNotifications(); } installErrorBoundary(); injectA11y(); registerPWA(); document.documentElement.dataset.proglogVersion = APP_VERSION; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
