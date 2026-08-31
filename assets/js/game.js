// Proglog Game Details / Trophy Tracker
(function () {
  'use strict';

  var currentUser = null;
  var cabinet = null;
  var game = null;
  var filter = 'all';
  var searchQuery = '';
  var sortMode = 'default';
  var eventsBound = false;

  function loadFromHash() {
    var rawHash = window.location.hash || '';
    var gameId = rawHash.replace(/^#\/?/, '').trim();
    if (!gameId) { window.pgGo('games'); return; }

    currentUser = getLastUser();
    if (!currentUser) { window.pgGo('auth'); return; }
    cabinet = getCabinetData(currentUser);
    if (!cabinet || !cabinet.games) { window.pgGo('overview'); return; }

    game = cabinet.games.filter(function (g) { return g.id === gameId; })[0];
    if (!game) { window.pgGo('games'); return; }
    game.achievements = game.achievements || [];

    filter = 'all';
    searchQuery = '';
    sortMode = 'default';

    var p = cabinet.profile || { username: currentUser, color: PROFILE_COLORS[0] };
    var avatar = avatarHtml(p);
    var topAvatar = document.getElementById('topbar-avatar-slot');
    var sideAvatar = document.getElementById('side-avatar-slot');
    if (topAvatar) topAvatar.innerHTML = avatar;
    if (sideAvatar) sideAvatar.innerHTML = avatarHtml(p, 'avatar-sm');
    var sideName = document.getElementById('side-user-name');
    if (sideName) sideName.textContent = p.username || currentUser;

    var notes = document.getElementById('game-notes-input');
    if (notes) notes.value = game.notes || '';
    var search = document.getElementById('search-achv');
    if (search) search.value = '';

    if (!eventsBound) { bindEvents(); eventsBound = true; }
    render();
  }

  function save() {
    if (currentUser && cabinet) setCabinetData(currentUser, cabinet);
  }

  function catalogTotal() {
    return Number(game.totalTrophies || 0);
  }

  function render() {
    var achievements = game.achievements || [];
    var prog = gameProgress(game);
    var plat = platformById(game.platform);
    var total = Math.max(prog.total, catalogTotal());
    var pct = total ? Math.round((prog.unlocked / total) * 100) : 0;
    var rm = game.roadmap || {};

    document.title = game.title + ' — Proglog';
    setText('detail-title', game.title);
    setText('detail-unlocked-count', prog.unlocked + ' / ' + total);
    setText('detail-pct', pct + '%');
    setText('detail-completion', pct + '%');
    setText('detail-release', game.releaseDate || '—');
    setText('detail-playtime', rm.time || '—');
    setText('detail-last-played', game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : '—');

    var platformEl = document.getElementById('detail-platform');
    if (platformEl) platformEl.innerHTML = '<span class="platform-dot" style="background:' + plat.color + '"></span>' + esc(plat.label);

    var desc = game.description || rm.summary || 'Track your progress, trophies, guides, and completion for this game.';
    setText('detail-description', desc);

    var cover = document.getElementById('game-cover-art');
    if (cover) {
      cover.style.background = 'linear-gradient(145deg,' + darken(game.color || '#16a66f', 0.55) + ',#111815 55%,' + (game.color || '#16a66f') + ')';
      cover.innerHTML = '<div class="cover-title">' + esc(game.title) + '</div>';
    }

    setText('count-platinum', achievements.filter(function(a){ return a.tier === 'platinum'; }).length);
    setText('count-gold', achievements.filter(function(a){ return a.tier === 'gold'; }).length);
    setText('count-silver', achievements.filter(function(a){ return a.tier === 'silver'; }).length);
    setText('count-bronze', achievements.filter(function(a){ return a.tier === 'bronze'; }).length);
    var bulkButton = document.getElementById('btn-mark-all');
    if (bulkButton) bulkButton.textContent = achievements.length && achievements.every(function(a){ return a.unlocked; }) ? '↺ Reset all trophies' : '✓ Mark all unlocked';
    var bar = document.getElementById('detail-progress-bar');
    if (bar) bar.style.width = pct + '%';

    setText('overview-roadmap', rm.summary || '—');
    setText('overview-time', rm.time || '—');
    setText('overview-missable', rm.missable || '—');

    renderChips();
    renderList();
    renderPreviewNotice();
  }

  function renderPreviewNotice() {
    var el = document.getElementById('catalog-preview-notice');
    if (!el) return;
    var expected = catalogTotal();
    var actual = (game.achievements || []).length;
    if (game.catalogPreview && expected > actual) {
      el.classList.remove('hidden');
      el.innerHTML = '<strong>Verified TSA catalog data</strong><span>' + actual + ' of ' + expected + ' achievements are bundled locally. The complete, current list and community guides are available from the source below.</span>';
    } else {
      el.classList.add('hidden');
    }
    var src = document.getElementById('achievement-source');
    if (!src) return;
    var tsa = game.tsa;
    if (tsa && tsa.achievementUrl) {
      src.classList.remove('hidden');
      src.innerHTML = '<div class="achievement-source-copy"><strong>Achievement source & guides</strong><span>Verified against TrueSteamAchievements. Use their complete list for the latest achievement records and community-written guides.</span></div>' +
        '<div class="achievement-source-actions"><a class="btn btn-ghost btn-sm" href="' + tsa.achievementUrl + '" target="_blank" rel="noopener noreferrer">Full achievement list ↗</a>' +
        '<a class="btn btn-primary btn-sm" href="' + tsa.guideUrl + '" target="_blank" rel="noopener noreferrer">Open walkthrough ↗</a></div>';
    } else {
      src.classList.add('hidden');
    }
  }

  function renderChips() {
    var all = game.achievements || [];
    var unlocked = all.filter(function(a){return a.unlocked;}).length;
    var locked = all.length - unlocked;
    var wrap = document.getElementById('achv-filter-chips');
    if (!wrap) return;
    var defs = [
      ['all','All',all.length], ['unlocked','Earned',unlocked], ['locked','Locked',locked],
      ['platinum','Platinum',all.filter(function(a){return a.tier==='platinum';}).length],
      ['gold','Gold',all.filter(function(a){return a.tier==='gold';}).length],
      ['silver','Silver',all.filter(function(a){return a.tier==='silver';}).length],
      ['bronze','Bronze',all.filter(function(a){return a.tier==='bronze';}).length]
    ];
    wrap.innerHTML = defs.map(function(d){
      return '<button class="chip ' + (filter===d[0]?'active':'') + '" data-filter="' + d[0] + '">' + d[1] + ' <span class="badge">' + d[2] + '</span></button>';
    }).join('');
    wrap.querySelectorAll('[data-filter]').forEach(function(btn){
      btn.addEventListener('click', function(){ filter = btn.getAttribute('data-filter'); renderChips(); renderList(); });
    });
  }

  function renderList() {
    var list = document.getElementById('achv-list');
    var empty = document.getElementById('achv-empty');
    if (!list) return;
    var items = (game.achievements || []).slice();

    if (filter === 'unlocked') items = items.filter(function(a){return a.unlocked;});
    else if (filter === 'locked') items = items.filter(function(a){return !a.unlocked;});
    else if (['bronze','silver','gold','platinum'].indexOf(filter) >= 0) items = items.filter(function(a){return a.tier === filter;});

    var q = searchQuery.trim().toLowerCase();
    if (q) items = items.filter(function(a){ return [a.name,a.description,a.guide,a.tag].join(' ').toLowerCase().indexOf(q) >= 0; });

    items.sort(function(a,b){
      if (sortMode === 'name') return String(a.name).localeCompare(String(b.name));
      if (sortMode === 'tier') return tierRank(a.tier) - tierRank(b.tier);
      if (sortMode === 'rarity') return rarityValue(a) - rarityValue(b);
      return 0;
    });

    if (!items.length) {
      list.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    list.innerHTML = items.map(function(a){
      var tier = tierById(a.tier);
      var rarity = a.rarity ? esc(a.rarity) : 'Rarity unavailable';
      var percentage = a.playerPercentage != null ? esc(a.playerPercentage) + '% of players' : '';
      var date = a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) + ' · ' + new Date(a.unlockedAt).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}) : '';
      return '<div class="achv-row ' + (a.unlocked?'unlocked':'') + '" data-id="' + esc(a.id) + '">' +
        '<button class="achv-check" data-toggle="' + esc(a.id) + '" title="' + (a.unlocked?'Mark locked':'Mark unlocked') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path d="M4 12l6 6L20 6"/></svg></button>' +
        '<div class="achv-body"><div class="achv-top-line">' + tierSvg(a.tier) + '<div class="achv-copy"><div class="achv-name">' + esc(a.name) + '</div><div class="achv-desc">' + esc(a.description || '') + '</div>' + (a.guide?'<div class="achv-guide"><b>Guide:</b> '+esc(a.guide)+'</div>':'') + '</div>' + (a.tag?'<span class="achv-tag">'+esc(a.tag)+'</span>':'') + '</div>' + (game.tsa ? '<a class="achv-source-link" href="' + game.tsa.achievementUrl + '" target="_blank" rel="noopener noreferrer">View TSA guide ↗</a>' : '') + '</div>' +
        '<div class="achv-rarity"><strong>' + rarity + '</strong>' + (percentage?'<span>'+percentage+'</span>':'') + '</div>' +
        '<div class="achv-status">' + (a.unlocked?'<strong>✓ Unlocked</strong><span>'+date+'</span>':'<strong>Locked</strong><span>Not yet unlocked</span>') + '</div>' +
        '<div class="achv-actions"><button class="icon-btn" data-edit="'+esc(a.id)+'" title="Edit">✎</button><button class="icon-btn danger" data-remove="'+esc(a.id)+'" title="Delete">×</button></div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('[data-toggle]').forEach(function(b){ b.addEventListener('click', function(){ toggleAchievement(b.getAttribute('data-toggle')); }); });
    list.querySelectorAll('[data-edit]').forEach(function(b){ b.addEventListener('click', function(){ editAchievement(b.getAttribute('data-edit')); }); });
    list.querySelectorAll('[data-remove]').forEach(function(b){ b.addEventListener('click', function(){ deleteAchievement(b.getAttribute('data-remove')); }); });
  }

  function toggleAchievement(id){
    var a = findAchievement(id); if (!a) return;
    a.unlocked = !a.unlocked; a.unlockedAt = a.unlocked ? Date.now() : null;
    game.lastPlayed = Date.now(); save(); render();
    if (a.unlocked) { playTrophyChime(); toast('"' + a.name + '" unlocked.'); }
  }

  function markAllUnlocked(){
    var all = game.achievements || [];
    if (!all.length) { toast('There are no bundled trophies to update.'); return; }
    var allUnlocked = all.every(function(a){return a.unlocked;});
    if (!confirm(allUnlocked ? 'Lock every trophy in this game?' : 'Mark every bundled trophy as unlocked?')) return;
    var now = Date.now();
    all.forEach(function(a){ a.unlocked = !allUnlocked; a.unlockedAt = allUnlocked ? null : now; });
    game.lastPlayed = now; save(); render(); toast(allUnlocked ? 'All trophies reset.' : 'All bundled trophies unlocked.');
  }

  function findAchievement(id){ return (game.achievements || []).filter(function(a){return a.id === id;})[0]; }
  function editAchievement(id){
    var a = findAchievement(id); if (!a) return;
    showAchvModal(a, function(updated){ Object.assign(a, updated); a.unlockedAt = a.unlocked ? (a.unlockedAt || Date.now()) : null; save(); render(); toast('Trophy updated.'); });
  }
  function deleteAchievement(id){
    var a = findAchievement(id); if (!a || !confirm('Delete "' + a.name + '"?')) return;
    game.achievements = game.achievements.filter(function(x){return x.id !== id;}); save(); render(); toast('Trophy removed.');
  }
  function onAddAchv(){
    showAchvModal(null, function(d){ game.achievements.push({id:uid(),name:d.name,description:d.description,guide:d.guide,tier:d.tier,tag:d.tag||'Story',unlocked:d.unlocked,unlockedAt:d.unlocked?Date.now():null}); save(); render(); toast('Trophy added.'); });
  }

  function bindEvents(){
    var search = document.getElementById('search-achv');
    if (search) search.addEventListener('input', function(e){searchQuery=e.target.value;renderList();});
    var sort = document.getElementById('trophy-sort');
    if (sort) sort.addEventListener('change', function(e){sortMode=e.target.value;renderList();});
    var mark = document.getElementById('btn-mark-all'); if (mark) mark.addEventListener('click', markAllUnlocked);
    var emptyAdd = document.getElementById('btn-add-achievement-empty'); if (emptyAdd) emptyAdd.addEventListener('click', onAddAchv);
    var more = document.getElementById('btn-more-trophy-actions'); if (more) more.addEventListener('click', function(){ toast('More trophy actions are coming with cloud sync.'); });

    var notes = document.getElementById('game-notes-input');
    if (notes) notes.addEventListener('input', function(){ game.notes = notes.value; save(); });

    document.querySelectorAll('.game-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        var key = tab.getAttribute('data-tab');
        document.querySelectorAll('.game-tab').forEach(function(t){t.classList.toggle('active',t===tab);});
        document.querySelectorAll('.game-tab-panel').forEach(function(p){p.classList.add('hidden');});
        var panel = document.getElementById('game-panel-' + key); if (panel) panel.classList.remove('hidden');
        var trophyPanel = document.getElementById('game-panel-trophies');
        if (trophyPanel) trophyPanel.classList.toggle('hidden', key !== 'trophies');
      });
    });

    var edit = document.getElementById('btn-edit-game'); if (edit) edit.addEventListener('click', function(){ showGameModal(game, function(updated){game.title=updated.title;game.platform=updated.platform;game.color=updated.color;save();render();toast('Game details updated.');}); });
    var del = document.getElementById('btn-delete-game'); if (del) del.addEventListener('click', function(){ if(!confirm('Delete "'+game.title+'" and all its trophies? This cannot be undone.'))return; cabinet.games=cabinet.games.filter(function(g){return g.id!==game.id;});save();window.pgGo('overview'); });
    window.addEventListener('hashchange', loadFromHash);
  }

  function setText(id, value){var el=document.getElementById(id);if(el)el.textContent=value;}
  function tierRank(t){return ({platinum:0,gold:1,silver:2,bronze:3}[t] ?? 4);}
  function rarityValue(a){ if(a.playerPercentage != null)return Number(a.playerPercentage); var r=String(a.rarity||'').toLowerCase(); return ({'ultra rare':1,'very rare':2,'rare':3,'uncommon':4,'common':5}[r] || 99); }
  function darken(hex, amount){
    var h=String(hex).replace('#',''); if(h.length!==6)return '#17352a';
    var n=parseInt(h,16); var r=Math.max(0,Math.floor(((n>>16)&255)*amount)); var g=Math.max(0,Math.floor(((n>>8)&255)*amount)); var b=Math.max(0,Math.floor((n&255)*amount)); return '#' + [r,g,b].map(function(x){return x.toString(16).padStart(2,'0');}).join('');
  }

  loadFromHash();
})();
