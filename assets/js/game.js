// Game details controller
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
    var gameId = decodeURIComponent(rawHash.replace(/^#\/?/, '').trim());
    if (!gameId) { window.pgGo('games'); return; }

    currentUser = getLastUser();
    if (!currentUser) { window.pgGo('auth'); return; }
    cabinet = getCabinetData(currentUser);
    if (!cabinet || !cabinet.games) { window.pgGo('overview'); return; }

    game = cabinet.games.filter(function (g) { return g.id === gameId; })[0];
    var catalogGame = (typeof getCatalogGame === 'function') ? getCatalogGame(gameId) : null;
    if (!game && catalogGame) {
      game = JSON.parse(JSON.stringify(catalogGame));
      game._catalogOnly = true;
      var bundled = (typeof getBundledTrophies === 'function') ? getBundledTrophies(gameId) : [];
      game.achievements = bundled.length ? JSON.parse(JSON.stringify(bundled)).map(function (a) {
        return { id: a.id || uid(), name: a.name, description: a.description || '', guide: a.guide || '', tier: a.tier || 'bronze', tag: a.tag || 'Story', rarity: a.rarity, playerPercentage: a.playerPercentage, unlocked: false, unlockedAt: null };
      }) : (game.achievements || []);
      var details = (typeof getGameDetails === 'function') ? getGameDetails(gameId) : null;
      if (details) game.detail = details;
    }
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
    if (game.detail && game.detail.counts) return Number(game.detail.counts.total || 0);
    var d = (typeof getGameDetails === 'function') ? getGameDetails(game.id) : null;
    return Number((d && d.counts && d.counts.total) || game.totalTrophies || 0);
  }

  function loadCoverImage() {
    if (!window.rawgClient || !game || !game.title) return;
    window.rawgClient.searchGames(game.title, function (results, error) {
      if (!error && results && results.length && results[0].background_image) {
        var cover = document.getElementById('game-cover-art');
        if (cover) {
          var imageUrl = results[0].background_image;
          cover.style.backgroundImage = 'url(' + imageUrl + ')';
          cover.style.backgroundSize = 'cover';
          cover.style.backgroundPosition = 'center';
          cover.style.backgroundAttachment = 'fixed';
          var overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.inset = '0';
          overlay.style.background = 'linear-gradient(135deg, rgba(' +
            darken(game.color || '#16a66f', 0.55).replace('#', '').match(/.{1,2}/g).map(function (x) { return parseInt(x, 16); }).join(',') +
            ', 0.75), rgba(17,24,21, 0.85))';
          overlay.style.pointerEvents = 'none';
          while (cover.firstChild) cover.removeChild(cover.firstChild);
          cover.appendChild(overlay);
          var title = document.createElement('div');
          title.className = 'cover-title';
          title.style.position = 'relative';
          title.style.zIndex = '1';
          title.textContent = game.title;
          cover.appendChild(title);
        }

        // Fetch full game details from RAWG
        if (results[0].id) {
          window.rawgClient.getGameDetails(results[0].id, function (details, err) {
            if (!err && details) {
              game._rawgData = details;
              renderRAWGInfo();
              renderRAWGScreenshots(results[0].id);
              renderSimilarGames(results[0].id);
              renderGameSeries(results[0].id);
            }
          });
        }
      }
    });
  }

  function renderRAWGInfo() {
    if (!game._rawgData) return;
    var data = game._rawgData;

    // Display ratings
    if (data.rating) setText('rawg-rating', (data.rating || 0).toFixed(1) + ' / 5');
    if (data.metacritic) setText('rawg-metacritic', data.metacritic);

    // Display genres
    var genreEl = document.getElementById('rawg-genres');
    if (genreEl && data.genres && data.genres.length) {
      genreEl.innerHTML = data.genres.map(function (g) {
        return '<span class="game-pill">' + esc(g) + '</span>';
      }).join('');
    }

    // Display platforms
    var platformEl = document.getElementById('rawg-platforms');
    if (platformEl && data.platforms && data.platforms.length) {
      platformEl.innerHTML = data.platforms.slice(0, 5).map(function (p) {
        return '<span class="game-pill">' + esc(p) + '</span>';
      }).join('');
    }

    // Display developers
    if (data.developers && data.developers.length) setText('rawg-developer', data.developers.slice(0, 3).join(', '));

    // Display publishers
    if (data.publishers && data.publishers.length) setText('rawg-publisher', data.publishers.slice(0, 2).join(', '));

    // Display ESRB rating
    if (data.esrb_rating) setText('rawg-esrb', data.esrb_rating);

    // Display playtime average
    if (data.playtime) setText('rawg-playtime', data.playtime + ' hrs average');

    // Display stores
    var storesEl = document.getElementById('rawg-stores');
    if (storesEl && data.stores && data.stores.length) {
      storesEl.innerHTML = data.stores.slice(0, 5).map(function (s) {
        return '<a class="btn btn-sm btn-ghost" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + ' ↗</a>';
      }).join('');
    }
  }

  function renderRAWGScreenshots(gameId) {
    if (!window.rawgClient) return;
    window.rawgClient.getGameScreenshots(gameId, function (screenshots, error) {
      if (!error && screenshots && screenshots.length) {
        var galEl = document.getElementById('rawg-screenshots');
        if (galEl) {
          galEl.innerHTML = screenshots.map(function (s, i) {
            return '<img src="' + esc(s.image) + '" alt="Screenshot ' + (i + 1) + '" loading="lazy" style="width:100%;border-radius:8px;cursor:pointer;" data-screenshot="' + esc(s.image) + '">';
          }).join('');
          galEl.querySelectorAll('img').forEach(function (img) {
            img.addEventListener('click', function () {
              var modal = document.getElementById('screenshot-modal');
              if (!modal) {
                modal = document.createElement('div');
                modal.id = 'screenshot-modal';
                modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;';
                document.body.appendChild(modal);
              }
              var fullImg = document.createElement('img');
              fullImg.src = img.getAttribute('data-screenshot');
              fullImg.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;';
              modal.innerHTML = '';
              modal.appendChild(fullImg);
              modal.addEventListener('click', function () { modal.style.display = 'none'; });
            });
          });
        }
      }
    });
  }

  function renderSimilarGames(gameId) {
    if (!window.rawgClient) return;
    window.rawgClient.getSimilarGames(gameId, function (games, error) {
      if (!error && games && games.length) {
        var simEl = document.getElementById('rawg-similar');
        if (simEl) {
          simEl.innerHTML = games.map(function (g) {
            return '<div style="text-align:center;"><img src="' + esc(g.background_image || '') + '" alt="' + esc(g.name) + '" style="width:100%;height:150px;object-fit:cover;border-radius:8px;"><p style="margin:8px 0 0;font-size:12px;">' + esc(g.name) + '</p><span class="pg-pill" style="font-size:11px;">★ ' + (g.rating || 0).toFixed(1) + '</span></div>';
          }).join('');
        }
      }
    });
  }

  function renderGameSeries(gameId) {
    if (!window.rawgClient) return;
    window.rawgClient.getGameSeries(gameId, function (games, error) {
      if (!error && games && games.length) {
        var serEl = document.getElementById('rawg-series');
        if (serEl) {
          serEl.innerHTML = games.map(function (g) {
            return '<div class="game-pill">' + esc(g.name) + ' (' + (g.released ? g.released.split('-')[0] : '—') + ')</div>';
          }).join('');
        }
      }
    });
  }

  function render() {
    var achievements = game.achievements || [];
    var prog = gameProgress(game);
    if (game._catalogOnly && !achievements.length && game.detail) {
      var note = document.getElementById('catalog-source-note');
      if (note) note.innerHTML = '<strong>Complete ' + esc(game.detail.counts.total) + '-item set available</strong><p>Proglog shows the verified total here. Use the source link for the complete trophy/achievement list and walkthrough.</p><a class="btn btn-ghost btn-sm" href="' + esc(game.detail.sourceUrl) + '" target="_blank" rel="noopener noreferrer">View ' + esc(game.detail.source) + ' ↗</a>';
      if (note) note.classList.remove('hidden');
    }
    var plat = platformById(game.platform);
    var total = Math.max(prog.total, catalogTotal());
    var pct = total ? Math.round((prog.unlocked / total) * 100) : 0;
    var rm = game.roadmap || {};

    document.title = game.title + ' — Proglog';
    setText('detail-title', game.title);
    setText('detail-unlocked-count', prog.unlocked + ' / ' + total);
    setText('detail-pct', pct + '%');
    setText('detail-completion', pct + '%');
    var addCatalog = document.getElementById('btn-add-catalog-game');
    if (addCatalog) {
      addCatalog.classList.toggle('hidden', !game._catalogOnly);
      if (game._catalogOnly) addCatalog.onclick = function () {
        var cat = (typeof getCatalogGame === 'function') ? getCatalogGame(game.id) : null;
        if (!cat) return;
        if (typeof currentUser === 'string' && cabinet) {
          var existing = (cabinet.games || []).some(function (x) { return x.title.toLowerCase() === cat.title.toLowerCase() && x.platform === cat.platform; });
          if (existing) { toast('Already in your Vault.'); return; }
        }
        if (!currentUser || !cabinet) { toast('Please create a profile first.'); return; }
        var newGame = {
          id: uid(), title: cat.title, platform: cat.platform || 'playstation', color: cat.color || PROFILE_COLORS[0], createdAt: Date.now(),
          roadmap: cat.roadmap ? JSON.parse(JSON.stringify(cat.roadmap)) : null, notes: '',
          achievements: (cat.achievements || []).map(function (a) { return { id: uid(), name: a.name, description: a.description, guide: a.guide || '', tier: a.tier || 'bronze', tag: a.tag || 'Story', unlocked: false, unlockedAt: null }; })
        };
        newGame.totalTrophies = cat.totalTrophies || (cat.detail && cat.detail.counts ? cat.detail.counts.total : 0);
        cabinet.games.push(newGame); save(); toast('"' + cat.title + '" added to your Vault.'); window.location.hash = '#' + encodeURIComponent(newGame.id); loadFromHash();
      };
    }
    setText('detail-release', game.releaseDate || '—');
    setText('detail-playtime', rm.time || '—');
    setText('detail-last-played', game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

    var platformEl = document.getElementById('detail-platform');
    if (platformEl) platformEl.innerHTML = '<span class="platform-dot" style="background:' + plat.color + '"></span>' + esc(plat.label);

    var desc = game.description || rm.summary || 'Track your progress, trophies, guides, and completion for this game.';
    setText('detail-description', desc);

    var cover = document.getElementById('game-cover-art');
    if (cover) {
      cover.style.background = 'linear-gradient(145deg,' + darken(game.color || '#16a66f', 0.55) + ',#111815 55%,' + (game.color || '#16a66f') + ')';
      cover.innerHTML = '<div class="cover-title">' + esc(game.title) + '</div>';
    }

    // Fetch and load cover image from RAWG.io
    loadCoverImage();

    var verifiedCounts = (game.detail && game.detail.counts) || (typeof getGameDetails === 'function' && getGameDetails(game.id) ? getGameDetails(game.id).counts : null);
    setText('count-platinum', verifiedCounts ? verifiedCounts.platinum : achievements.filter(function (a) { return a.tier === 'platinum'; }).length);
    setText('count-gold', verifiedCounts ? verifiedCounts.gold : achievements.filter(function (a) { return a.tier === 'gold'; }).length);
    setText('count-silver', verifiedCounts ? verifiedCounts.silver : achievements.filter(function (a) { return a.tier === 'silver'; }).length);
    setText('count-bronze', verifiedCounts ? verifiedCounts.bronze : achievements.filter(function (a) { return a.tier === 'bronze'; }).length);
    var bulkButton = document.getElementById('btn-mark-all');
    if (bulkButton) bulkButton.textContent = achievements.length && achievements.every(function (a) { return a.unlocked; }) ? '↺ Reset all trophies' : '✓ Mark all unlocked';
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
      var sourceName = (game.detail && game.detail.source) || game.trophySource || 'platform source';
      el.innerHTML = '<strong>' + actual + ' trophies bundled locally</strong><span>Proglog shows the trophy records available in its local library. The verified total is ' + expected + '. Use ' + esc(sourceName) + ' for the authoritative current set, or connect the platform account to sync the complete list.</span>';
    } else {
      el.classList.add('hidden');
    }
    var src = document.getElementById('achievement-source');
    if (!src) return;
    var tsa = game.tsa;
    if (tsa && tsa.achievementUrl) {
      src.classList.remove('hidden');
      src.innerHTML = '<div class="achievement-source-copy"><strong>Achievement source & guide</strong><span>Source: ' + esc(game.detail && game.detail.source ? game.detail.source : 'TrueSteamAchievements') + '. Proglog displays bundled trophy records here; the external list remains available for updates and reference.</span></div>' +
        '<div class="achievement-source-actions"><a class="btn btn-ghost btn-sm" href="' + tsa.achievementUrl + '" target="_blank" rel="noopener noreferrer">Full achievement list ↗</a>' +
        '<a class="btn btn-primary btn-sm" href="' + tsa.guideUrl + '" target="_blank" rel="noopener noreferrer">Open walkthrough ↗</a></div>';
    } else {
      src.classList.add('hidden');
    }
  }

  function renderChips() {
    var all = game.achievements || [];
    var unlocked = all.filter(function (a) { return a.unlocked; }).length;
    var locked = all.length - unlocked;
    var wrap = document.getElementById('achv-filter-chips');
    if (!wrap) return;
    var defs = [
      ['all', 'All', all.length], ['unlocked', 'Earned', unlocked], ['locked', 'Locked', locked],
      ['platinum', 'Platinum', all.filter(function (a) { return a.tier === 'platinum'; }).length],
      ['gold', 'Gold', all.filter(function (a) { return a.tier === 'gold'; }).length],
      ['silver', 'Silver', all.filter(function (a) { return a.tier === 'silver'; }).length],
      ['bronze', 'Bronze', all.filter(function (a) { return a.tier === 'bronze'; }).length]
    ];
    wrap.innerHTML = defs.map(function (d) {
      return '<button class="chip ' + (filter === d[0] ? 'active' : '') + '" data-filter="' + d[0] + '">' + d[1] + ' <span class="badge">' + d[2] + '</span></button>';
    }).join('');
    wrap.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () { filter = btn.getAttribute('data-filter'); renderChips(); renderList(); });
    });
  }

  function renderList() {
    var list = document.getElementById('achv-list');
    var empty = document.getElementById('achv-empty');
    if (!list) return;
    var items = (game.achievements || []).slice();

    if (filter === 'unlocked') items = items.filter(function (a) { return a.unlocked; });
    else if (filter === 'locked') items = items.filter(function (a) { return !a.unlocked; });
    else if (['bronze', 'silver', 'gold', 'platinum'].indexOf(filter) >= 0) items = items.filter(function (a) { return a.tier === filter; });

    var q = searchQuery.trim().toLowerCase();
    if (q) items = items.filter(function (a) { return [a.name, a.description, a.guide, a.tag].join(' ').toLowerCase().indexOf(q) >= 0; });

    items.sort(function (a, b) {
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

    list.innerHTML = items.map(function (a) {
      var tier = tierById(a.tier);
      var rarity = a.rarity ? esc(a.rarity) : 'Rarity unavailable';
      var percentage = a.playerPercentage != null ? esc(a.playerPercentage) + '% of players' : '';
      var date = a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + new Date(a.unlockedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
      return '<div class="achv-row ' + (a.unlocked ? 'unlocked' : '') + '" data-id="' + esc(a.id) + '">' +
        '<button class="achv-check" data-toggle="' + esc(a.id) + '" title="' + (a.unlocked ? 'Mark locked' : 'Mark unlocked') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><path d="M4 12l6 6L20 6"/></svg></button>' +
        '<div class="achv-body"><div class="achv-top-line">' + tierSvg(a.tier) + '<div class="achv-copy"><div class="achv-name">' + esc(a.name) + '</div><div class="achv-desc">' + esc(a.description || '') + '</div>' + (a.guide ? '<div class="achv-guide"><b>Guide:</b> ' + esc(a.guide) + '</div>' : '') + '</div>' + (a.tag ? '<span class="achv-tag">' + esc(a.tag) + '</span>' : '') + '</div>' + (((game.detail && game.detail.sourceUrl) || game.trophySourceUrl) ? '<a class="achv-source-link" href="' + esc((game.detail && game.detail.sourceUrl) || game.trophySourceUrl) + '" target="_blank" rel="noopener noreferrer">' + esc((game.detail && game.detail.source) || game.trophySource || 'Source') + ' ↗</a>' : '') + '</div>' +
        '<div class="achv-rarity"><strong>' + rarity + '</strong>' + (percentage ? '<span>' + percentage + '</span>' : '') + '</div>' +
        '<div class="achv-status">' + (a.unlocked ? '<strong>✓ Unlocked</strong><span>' + date + '</span>' : '<strong>Locked</strong><span>Not yet unlocked</span>') + '</div>' +
        '<div class="achv-actions"><button class="icon-btn" data-edit="' + esc(a.id) + '" title="Edit">✎</button><button class="icon-btn danger" data-remove="' + esc(a.id) + '" title="Delete">×</button></div>' +
        '</div>';
    }).join('');

    list.querySelectorAll('[data-toggle]').forEach(function (b) { b.addEventListener('click', function () { toggleAchievement(b.getAttribute('data-toggle')); }); });
    list.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { editAchievement(b.getAttribute('data-edit')); }); });
    list.querySelectorAll('[data-remove]').forEach(function (b) { b.addEventListener('click', function () { deleteAchievement(b.getAttribute('data-remove')); }); });
  }

  function toggleAchievement(id) {
    var a = findAchievement(id); if (!a) return;
    a.unlocked = !a.unlocked; a.unlockedAt = a.unlocked ? Date.now() : null;
    game.lastPlayed = Date.now(); save(); render();
    if (a.unlocked) { playTrophyChime(); toast('"' + a.name + '" unlocked.'); }
  }

  function markAllUnlocked() {
    var all = game.achievements || [];
    if (!all.length) { toast('There are no bundled trophies to update.'); return; }
    var allUnlocked = all.every(function (a) { return a.unlocked; });
    if (!confirm(allUnlocked ? 'Lock every trophy in this game?' : 'Mark every bundled trophy as unlocked?')) return;
    var now = Date.now();
    all.forEach(function (a) { a.unlocked = !allUnlocked; a.unlockedAt = allUnlocked ? null : now; });
    game.lastPlayed = now; save(); render(); toast(allUnlocked ? 'All trophies reset.' : 'All bundled trophies unlocked.');
  }

  function findAchievement(id) { return (game.achievements || []).filter(function (a) { return a.id === id; })[0]; }
  function editAchievement(id) {
    var a = findAchievement(id); if (!a) return;
    showAchvModal(a, function (updated) { Object.assign(a, updated); a.unlockedAt = a.unlocked ? (a.unlockedAt || Date.now()) : null; save(); render(); toast('Trophy updated.'); });
  }
  function deleteAchievement(id) {
    var a = findAchievement(id); if (!a || !confirm('Delete "' + a.name + '"?')) return;
    game.achievements = game.achievements.filter(function (x) { return x.id !== id; }); save(); render(); toast('Trophy removed.');
  }
  function onAddAchv() {
    showAchvModal(null, function (d) { game.achievements.push({ id: uid(), name: d.name, description: d.description, guide: d.guide, tier: d.tier, tag: d.tag || 'Story', unlocked: d.unlocked, unlockedAt: d.unlocked ? Date.now() : null }); save(); render(); toast('Trophy added.'); });
  }

  function bindEvents() {
    var search = document.getElementById('search-achv');
    if (search) search.addEventListener('input', function (e) { searchQuery = e.target.value; renderList(); });
    var sort = document.getElementById('trophy-sort');
    if (sort) sort.addEventListener('change', function (e) { sortMode = e.target.value; renderList(); });
    var mark = document.getElementById('btn-mark-all'); if (mark) mark.addEventListener('click', markAllUnlocked);
    var emptyAdd = document.getElementById('btn-add-achievement-empty'); if (emptyAdd) emptyAdd.addEventListener('click', onAddAchv);
    var more = document.getElementById('btn-more-trophy-actions'); if (more) more.addEventListener('click', function () {
      var unlocked = (game.achievements || []).filter(function (a) { return a.unlocked; }).length;
      var total = (game.achievements || []).length;
      toast(unlocked + ' of ' + total + ' bundled trophies unlocked.');
    });

    var notes = document.getElementById('game-notes-input');
    if (notes) notes.addEventListener('input', function () { game.notes = notes.value; save(); });

    document.querySelectorAll('.game-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        document.querySelectorAll('.game-tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
        document.querySelectorAll('.game-tab-panel').forEach(function (p) { p.classList.add('hidden'); });
        var panel = document.getElementById('game-panel-' + key); if (panel) panel.classList.remove('hidden');
        var trophyPanel = document.getElementById('game-panel-trophies');
        if (trophyPanel) trophyPanel.classList.toggle('hidden', key !== 'trophies');
      });
    });

    var edit = document.getElementById('btn-edit-game'); if (edit) edit.addEventListener('click', function () { if (game._catalogOnly) { toast('Add this game to your Vault to edit it.'); return; } showGameModal(game, function (updated) { game.title = updated.title; game.platform = updated.platform; game.color = updated.color; save(); render(); toast('Game details updated.'); }); });
    var del = document.getElementById('btn-delete-game'); if (del) del.addEventListener('click', function () { if (game._catalogOnly) { toast('This catalog entry is read-only. Add it to your Vault first.'); return; } if (!confirm('Delete "' + game.title + '" and all its trophies? This cannot be undone.')) return; cabinet.games = cabinet.games.filter(function (g) { return g.id !== game.id; }); save(); window.pgGo('overview'); });
    window.addEventListener('hashchange', loadFromHash);
  }

  function setText(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
  function tierRank(t) { return ({ platinum: 0, gold: 1, silver: 2, bronze: 3 }[t] ?? 4); }
  function rarityValue(a) { if (a.playerPercentage != null) return Number(a.playerPercentage); var r = String(a.rarity || '').toLowerCase(); return ({ 'ultra rare': 1, 'very rare': 2, 'rare': 3, 'uncommon': 4, 'common': 5 }[r] || 99); }
  function darken(hex, amount) {
    var h = String(hex).replace('#', ''); if (h.length !== 6) return '#17352a';
    var n = parseInt(h, 16); var r = Math.max(0, Math.floor(((n >> 16) & 255) * amount)); var g = Math.max(0, Math.floor(((n >> 8) & 255) * amount)); var b = Math.max(0, Math.floor((n & 255) * amount)); return '#' + [r, g, b].map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  loadFromHash();
})();
