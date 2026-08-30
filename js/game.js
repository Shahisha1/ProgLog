// Proglog Game Details & Checklist Controller
(function() {
  'use strict';

  var currentUser = null;
  var cabinet = null;
  var game = null;
  var filter = 'all';
  var searchQuery = '';
  var eventsBound = false;

  // Loads (or reloads) the game referenced by the URL hash and renders it.
  // Safe to call repeatedly (e.g. on hashchange) — only binds DOM events once.
  function loadFromHash() {
    var rawHash = window.location.hash || '';
    var gameId = rawHash.replace(/^#\/?/, '').trim();

    if (!gameId) {
      window.location.href = 'app.html';
      return;
    }

    currentUser = getLastUser();
    if (!currentUser) {
      window.location.href = 'app.html';
      return;
    }

    cabinet = getCabinetData(currentUser);
    if (!cabinet || !cabinet.games) {
      window.location.href = 'app.html';
      return;
    }

    game = cabinet.games.filter(function(g) { return g.id === gameId; })[0];
    if (!game) {
      window.location.href = 'app.html';
      return;
    }

    if (!game.achievements) {
      game.achievements = [];
    }

    filter = 'all';
    searchQuery = '';

    // Populate topbar with custom PFP
    var p = cabinet.profile || { username: currentUser, color: PROFILE_COLORS[0] };
    var avSlot = document.getElementById('topbar-avatar-slot');
    if (avSlot) {
      avSlot.innerHTML = avatarHtml(p);
    }
    var nameEl = document.getElementById('topbar-name');
    if (nameEl) nameEl.textContent = p.username;

    // Load notes
    var notesInput = document.getElementById('game-notes-input');
    if (notesInput) {
      notesInput.value = game.notes || '';
    }
    var searchInputEl = document.getElementById('search-achv');
    if (searchInputEl) searchInputEl.value = '';

    if (!eventsBound) {
      bindEvents();
      eventsBound = true;
    }
    render();
  }

  function save() {
    if (currentUser && cabinet) {
      setCabinetData(currentUser, cabinet);
    }
  }

  function render() {
    var prog = gameProgress(game);
    var plat = platformById(game.platform);

    document.title = game.title + ' — Proglog Checklist';
    var crumbTitle = document.getElementById('crumb-game-title');
    if (crumbTitle) crumbTitle.textContent = game.title;

    document.getElementById('detail-title').textContent = game.title;
    document.getElementById('detail-platform').innerHTML =
      '<span class="platform-dot" style="background:' + plat.color + '"></span>' + plat.label;
    document.getElementById('detail-unlocked-count').textContent = prog.unlocked + '/' + prog.total;
    document.getElementById('detail-points').textContent = prog.points.toLocaleString();
    document.getElementById('detail-remaining').textContent = prog.total - prog.unlocked;
    document.getElementById('detail-pct').textContent = prog.pct + '%';

    var r = 42;
    var circumference = 2 * Math.PI * r;
    var ring = document.getElementById('detail-ring');
    if (ring) {
      ring.setAttribute('stroke-dasharray', circumference);
      ring.setAttribute('stroke-dashoffset', ringDashoffset(prog.pct, r));
    }

    renderRoadmap();
    renderChips();
    renderList();
  }

  function renderRoadmap() {
    var wrap = document.getElementById('detail-roadmap');
    if (!wrap) return;

    var rm = game.roadmap;
    if (!rm) {
      wrap.innerHTML = '';
      wrap.classList.add('hidden');
      return;
    }

    wrap.classList.remove('hidden');
    wrap.innerHTML =
      '<div class="roadmap-strip">' +
        (rm.difficulty ? '<div class="roadmap-item"><span class="roadmap-label">Difficulty</span><span class="roadmap-val">' + esc(rm.difficulty) + (rm.difficultyLabel ? ' (' + esc(rm.difficultyLabel) + ')' : '') + '</span></div>' : '') +
        (rm.time ? '<div class="roadmap-item"><span class="roadmap-label">Est. Time</span><span class="roadmap-val">' + esc(rm.time) + '</span></div>' : '') +
        (rm.playthroughs ? '<div class="roadmap-item"><span class="roadmap-label">Playthroughs</span><span class="roadmap-val">' + esc(rm.playthroughs) + '</span></div>' : '') +
        (rm.missable ? '<div class="roadmap-item"><span class="roadmap-label">Missables</span><span class="roadmap-val">' + esc(rm.missable) + '</span></div>' : '') +
      '</div>' +
      (rm.summary ? '<div class="roadmap-summary"><b>Trophy Roadmap Summary:</b> ' + esc(rm.summary) + '</div>' : '');
  }

  function renderChips() {
    var all = game.achievements || [];
    var unlocked = all.filter(function(a) { return a.unlocked; }).length;
    var locked = all.length - unlocked;
    var plat = all.filter(function(a) { return a.tier === 'platinum'; }).length;
    var gold = all.filter(function(a) { return a.tier === 'gold'; }).length;
    var silver = all.filter(function(a) { return a.tier === 'silver'; }).length;
    var bronze = all.filter(function(a) { return a.tier === 'bronze'; }).length;

    var wrap = document.getElementById('achv-filter-chips');
    if (!wrap) return;

    wrap.innerHTML =
      '<button class="chip ' + (filter==='all'?'active':'') + '" data-filter="all">All <span class="badge">' + all.length + '</span></button>' +
      '<button class="chip ' + (filter==='unlocked'?'active':'') + '" data-filter="unlocked">Unlocked <span class="badge">' + unlocked + '</span></button>' +
      '<button class="chip ' + (filter==='locked'?'active':'') + '" data-filter="locked">Locked <span class="badge">' + locked + '</span></button>' +
      '<button class="chip ' + (filter==='platinum'?'active':'') + '" data-filter="platinum">Platinum <span class="badge">' + plat + '</span></button>' +
      '<button class="chip ' + (filter==='gold'?'active':'') + '" data-filter="gold">Gold <span class="badge">' + gold + '</span></button>' +
      '<button class="chip ' + (filter==='silver'?'active':'') + '" data-filter="silver">Silver <span class="badge">' + silver + '</span></button>' +
      '<button class="chip ' + (filter==='bronze'?'active':'') + '" data-filter="bronze">Bronze <span class="badge">' + bronze + '</span></button>';

    wrap.querySelectorAll('.chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        wrap.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
        chip.classList.add('active');
        filter = chip.getAttribute('data-filter');
        renderList();
      });
    });
  }

  function renderList() {
    var list = document.getElementById('achv-list');
    var emptyEl = document.getElementById('achv-empty');
    var items = (game.achievements || []).slice();

    if (items.length === 0) {
      list.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    if (filter === 'unlocked') {
      items = items.filter(function(a) { return a.unlocked; });
    } else if (filter === 'locked') {
      items = items.filter(function(a) { return !a.unlocked; });
    } else if (['bronze', 'silver', 'gold', 'platinum'].indexOf(filter) !== -1) {
      items = items.filter(function(a) { return a.tier === filter; });
    }

    if (searchQuery.trim()) {
      var q = searchQuery.trim().toLowerCase();
      items = items.filter(function(a) {
        return (a.name || '').toLowerCase().indexOf(q) !== -1 ||
               (a.description || '').toLowerCase().indexOf(q) !== -1 ||
               (a.guide || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state"><h3>No matching trophies</h3><p>Try clearing your search query or switching tabs.</p></div>';
      return;
    }

    list.innerHTML = items.map(function(a) {
      var tier = tierById(a.tier);
      var tagClass = a.tag ? 'tag-' + a.tag.toLowerCase().replace(/[^a-z0-9]/g, '') : 'tag-story';
      var dateStr = a.unlockedAt
        ? new Date(a.unlockedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

      return '<div class="achv-row ' + (a.unlocked ? 'unlocked' : '') + '" style="border-left-color:' + tier.color + '" data-id="' + a.id + '">' +
        '<button class="achv-check" data-toggle="' + a.id + '" title="Mark ' + (a.unlocked ? 'locked' : 'unlocked') + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="#040608" stroke-width="3.5"><path d="M4 12l6 6L20 6"/></svg>' +
        '</button>' +
        '<div class="achv-body">' +
          '<div class="achv-top-line">' +
            tierSvg(a.tier) +
            '<div class="achv-name">' + esc(a.name) + '</div>' +
            (a.tag ? '<span class="achv-tag ' + tagClass + '">' + esc(a.tag) + '</span>' : '') +
            '<div class="achv-points">+' + tier.points + ' pts</div>' +
          '</div>' +
          (a.description ? '<div class="achv-desc">' + esc(a.description) + '</div>' : '') +
          (a.guide ? '<div class="achv-guide"><b>Unlock Guide: </b>' + esc(a.guide) + '</div>' : '') +
          '<div class="achv-meta-line">' +
            (a.unlocked ? '<div class="achv-date">🏆 Unlocked on ' + dateStr + '</div>' : '<div class="achv-date">Not yet unlocked</div>') +
            '<div class="achv-actions">' +
              '<button class="icon-btn" data-edit="' + a.id + '" title="Edit Trophy"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>' +
              '<button class="icon-btn danger" data-remove="' + a.id + '" title="Delete Trophy"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/></svg></button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('[data-toggle]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-toggle');
        toggleAchievement(id);
      });
    });

    list.querySelectorAll('[data-edit]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-edit');
        editAchievement(id);
      });
    });

    list.querySelectorAll('[data-remove]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-remove');
        deleteAchievement(id);
      });
    });
  }

  function toggleAchievement(achvId) {
    var a = game.achievements.filter(function(x) { return x.id === achvId; })[0];
    if (!a) return;
    a.unlocked = !a.unlocked;
    a.unlockedAt = a.unlocked ? Date.now() : null;
    save();
    render();
    if (a.unlocked) {
      playTrophyChime();
      toast('"' + a.name + '" unlocked! (+' + tierById(a.tier).points + ' pts)');
    }
  }

  function editAchievement(achvId) {
    var a = game.achievements.filter(function(x) { return x.id === achvId; })[0];
    if (!a) return;
    showAchvModal(a, function(updated) {
      a.name = updated.name;
      a.description = updated.description;
      a.guide = updated.guide;
      a.tier = updated.tier;
      a.tag = updated.tag;
      if (updated.unlocked && !a.unlocked) {
        a.unlockedAt = Date.now();
      } else if (!updated.unlocked) {
        a.unlockedAt = null;
      }
      a.unlocked = updated.unlocked;
      save();
      render();
      toast('Trophy updated.');
    });
  }

  function deleteAchievement(achvId) {
    var a = game.achievements.filter(function(x) { return x.id === achvId; })[0];
    if (!a) return;
    if (!confirm('Delete "' + a.name + '"?')) return;
    game.achievements = game.achievements.filter(function(x) { return x.id !== achvId; });
    save();
    render();
    toast('Trophy removed.');
  }

  function onAddAchv() {
    showAchvModal(null, function(formData) {
      var item = {
        id: uid(),
        name: formData.name,
        description: formData.description,
        guide: formData.guide,
        tier: formData.tier,
        tag: formData.tag || 'Story',
        unlocked: formData.unlocked,
        unlockedAt: formData.unlocked ? Date.now() : null
      };
      game.achievements.push(item);
      save();
      render();
      toast('"' + item.name + '" added to checklist.');
    });
  }

  function bindEvents() {
    var backBtn = document.getElementById('btn-back-dashboard');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        window.location.href = 'app.html';
      });
    }

    var switchBtn = document.getElementById('btn-switch-profile');
    if (switchBtn) {
      switchBtn.addEventListener('click', function() {
        setLastUser(null);
        window.location.href = 'app.html';
      });
    }

    var searchInput = document.getElementById('search-achv');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value;
        renderList();
      });
    }

    // Auto-save Hunter Notes
    var notesInput = document.getElementById('game-notes-input');
    if (notesInput) {
      notesInput.addEventListener('input', function(e) {
        game.notes = e.target.value;
        save();
      });
    }

    document.getElementById('btn-add-achievement').addEventListener('click', onAddAchv);
    document.getElementById('btn-add-achievement-empty').addEventListener('click', onAddAchv);

    document.getElementById('btn-edit-game').addEventListener('click', function() {
      showGameModal(game, function(updated) {
        game.title = updated.title;
        game.platform = updated.platform;
        game.color = updated.color;
        save();
        render();
        toast('Game details updated.');
      });
    });

    document.getElementById('btn-delete-game').addEventListener('click', function() {
      if (!confirm('Delete "' + game.title + '" and all its trophies? This cannot be undone.')) return;
      cabinet.games = cabinet.games.filter(function(g) { return g.id !== game.id; });
      save();
      window.location.href = 'app.html';
    });

    window.addEventListener('hashchange', function() {
      loadFromHash();
    });
  }

  loadFromHash();
})();
