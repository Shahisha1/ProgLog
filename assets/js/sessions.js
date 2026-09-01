(function () {
  'use strict';
  var user = typeof getLastUser === 'function' ? getLastUser() : null;
  if (!user || typeof getCabinetData !== 'function') return;
  var cabinet = getCabinetData(user) || { profile: { username: user }, games: [] };
  cabinet.sessions = Array.isArray(cabinet.sessions) ? cabinet.sessions : [];

  function save() { if (typeof setCabinetData === 'function') setCabinetData(user, cabinet); }
  function render() {
    var list = document.getElementById('session-list'), empty = document.getElementById('session-empty');
    if (!list) return;
    var sessions = cabinet.sessions.slice().sort(function (a, b) { return b.startedAt - a.startedAt; });
    var total = sessions.reduce(function (n, s) { return n + Number(s.minutes || 0); }, 0);
    var week = sessions.filter(function (s) { return Date.now() - s.startedAt < 7 * 86400000; }).reduce(function (n, s) { return n + Number(s.minutes || 0); }, 0);
    var month = sessions.filter(function (s) { return Date.now() - s.startedAt < 31 * 86400000; }).reduce(function (n, s) { return n + Number(s.minutes || 0); }, 0);
    function hours(min) { return (min / 60).toFixed(min % 60 ? 1 : 0) + 'h'; }
    var w = document.getElementById('session-week'), m = document.getElementById('session-month'), t = document.getElementById('session-total');
    if (w) w.textContent = hours(week); if (m) m.textContent = hours(month); if (t) t.textContent = hours(total);
    if (empty) empty.classList.toggle('hidden', sessions.length > 0);
    list.innerHTML = sessions.length ? sessions.map(function (s) { return '<div class="session-row"><div><strong>' + esc(s.gameTitle) + '</strong><div class="pg-muted">' + esc(s.note || 'Play session') + '</div></div><div class="session-row-meta"><strong>' + hours(s.minutes) + '</strong><span>' + new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + '</span></div></div>'; }).join('') : '';
  }
  function openLog() {
    var games = cabinet.games || [];
    var overlay = document.createElement('div'); overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal"><div class="modal-head"><h3>Log a play session</h3><button class="modal-close" id="session-close">×</button></div><div class="modal-body"><div class="field"><label class="field-label">Game</label><select id="session-game">' + games.map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(g.title) + '</option>'; }).join('') + '</select></div><div class="field"><label class="field-label">Minutes played</label><input id="session-minutes" type="number" min="1" max="1440" value="60"></div><div class="field"><label class="field-label">Note</label><input id="session-note" maxlength="120" placeholder="Optional note"></div></div><div class="modal-foot"><button class="btn btn-ghost" id="session-cancel">Cancel</button><button class="btn btn-primary" id="session-save">Log session</button></div></div>';
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.querySelector('#session-close').onclick = close; overlay.querySelector('#session-cancel').onclick = close;
    overlay.querySelector('#session-save').onclick = function () {
      var g = games.filter(function (x) { return x.id === overlay.querySelector('#session-game').value; })[0];
      var minutes = Math.max(1, Math.min(1440, Number(overlay.querySelector('#session-minutes').value) || 0));
      if (!g) { return; }
      cabinet.sessions.push({ id: 's_' + Date.now(), gameId: g.id, gameTitle: g.title, minutes: minutes, note: overlay.querySelector('#session-note').value.trim(), startedAt: Date.now() });
      g.lastPlayed = Date.now(); save(); close(); render(); if (window.toast) window.toast('Session logged.');
    };
  }
  render();
  var btn = document.getElementById('btn-log-session'); if (btn) btn.addEventListener('click', openLog);
})();
