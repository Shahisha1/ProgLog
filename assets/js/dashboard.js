// Dashboard controller
(function () {
  'use strict';

  var state = {
    profiles: [],
    currentUser: null,
    cabinet: null,
    search: '',
    platformFilter: 'all',
    sortBy: 'recent',
    newProfileColor: PROFILE_COLORS[0],
    newProfileAvatar: null
  };

  function init() {
    state.profiles = getProfiles();

    if (!storageWorks) {
      var note = document.getElementById('profile-empty');
      if (note) {
        note.textContent = 'Local storage is disabled in this browser. Your data will only persist for this session.';
      }
    }

    // A registered account must complete profile setup before the dashboard is available.
    var activeSession = getCurrentSession();
    if (activeSession && !activeSession.setupComplete) {
      window.pgGo('auth');
      return;
    }
    if (activeSession && window.applyProglogTheme) window.applyProglogTheme(activeSession.color);

    // check if there is an active session
    var last = getLastUser();
    if (last && state.profiles.some(function (p) { return p.username === last; })) {
      var data = getCabinetData(last);
      if (data) {
        state.currentUser = last;
        state.cabinet = data;
      }
    }

    if (state.currentUser && state.cabinet) {
      showMain();
    } else {
      showAuth();
    }

    bindEvents();
  }

  function save() {
    if (!state.currentUser || !state.cabinet) return;
    setCabinetData(state.currentUser, state.cabinet);
  }

  function showAuth() {
    document.getElementById('screen-auth').classList.remove('hidden');
    document.getElementById('screen-auth').classList.add('profile-switcher-open');
    document.getElementById('screen-main').classList.add('hidden');
    drawProfiles();
    drawSwatches();
  }

  function showMain() {
    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('screen-auth').classList.remove('profile-switcher-open');
    document.getElementById('screen-main').classList.remove('hidden');

    var p = state.cabinet.profile || { username: state.currentUser, color: PROFILE_COLORS[0] };
    var avSlot = document.getElementById('topbar-avatar-slot');
    if (avSlot) {
      avSlot.innerHTML = avatarHtml(p);
    }
    var nameEl = document.getElementById('topbar-name');
    if (nameEl) {
      nameEl.textContent = p.username;
    }

    renderDashboard();
  }

  function drawSwatches() {
    var wrap = document.getElementById('color-swatches');
    if (!wrap) return;
    wrap.innerHTML = '';
    PROFILE_COLORS.forEach(function (c) {
      var sw = document.createElement('div');
      sw.className = 'swatch' + (c === state.newProfileColor ? ' selected' : '');
      sw.style.background = c;
      sw.addEventListener('click', function () {
        state.newProfileColor = c;
        updatePfpPreview();
        drawSwatches();
      });
      wrap.appendChild(sw);
    });
  }

  function updatePfpPreview() {
    var prev = document.getElementById('pfp-preview-el');
    if (!prev) return;
    if (state.newProfileAvatar) {
      prev.innerHTML = '<img src="' + esc(state.newProfileAvatar) + '" alt="Avatar Preview">';
    } else {
      var nameVal = (document.getElementById('new-profile-name').value || 'PV').trim();
      prev.innerHTML = '<span style="font-family:\'JetBrains Mono\'; font-weight:700; font-size:20px; color:#06080e;">' + esc(initials(nameVal)) + '</span>';
      prev.style.background = state.newProfileColor;
    }
  }

  function drawProfiles() {
    var wrap = document.getElementById('profile-list');
    var emptyNote = document.getElementById('profile-empty');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (state.profiles.length === 0) {
      if (emptyNote) emptyNote.classList.remove('hidden');
      return;
    }
    if (emptyNote) emptyNote.classList.add('hidden');

    state.profiles.forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'profile-row';
      row.innerHTML =
        '<button class="enter" data-u="' + esc(p.username) + '">' +
        avatarHtml(p) +
        '<div><div class="pname">' + esc(p.username) + '</div><div class="pmeta">Open Vault</div></div>' +
        '</button>' +
        '<button class="icon-btn danger" data-rm="' + esc(p.username) + '" title="Remove profile">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/></svg>' +
        '</button>';
      wrap.appendChild(row);
    });

    wrap.querySelectorAll('button.enter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        enterProfile(btn.getAttribute('data-u'));
      });
    });

    wrap.querySelectorAll('button[data-rm]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var name = btn.getAttribute('data-rm');
        if (confirm('Delete "' + name + '" and everything in their vault? This cannot be undone.')) {
          state.profiles = state.profiles.filter(function (p) { return p.username !== name; });
          setProfiles(state.profiles);
          if (storageWorks) localStorage.removeItem('cabinet_data_' + name);
          drawProfiles();
        }
      });
    });
  }

  function enterProfile(username) {
    var cab = getCabinetData(username);
    if (!cab) {
      var meta = state.profiles.filter(function (p) { return p.username === username; })[0];
      cab = {
        profile: meta || { username: username, color: PROFILE_COLORS[0], createdAt: Date.now() },
        games: []
      };
    }
    state.currentUser = username;
    state.cabinet = cab;
    setLastUser(username);
    showMain();
  }

  function populatePlatforms() {
    var sel = document.getElementById('filter-platform');
    if (!sel) return;
    var used = {};
    (state.cabinet.games || []).forEach(function (g) { used[g.platform] = true; });

    sel.innerHTML = '<option value="all">All Platforms</option>' +
      PLATFORMS.filter(function (p) { return used[p.id]; }).map(function (p) {
        return '<option value="' + p.id + '">' + p.label + '</option>';
      }).join('');
    sel.value = state.platformFilter;
  }

  function renderDashboard() {
    var games = state.cabinet.games || [];
    var totals = cabinetTotals(games);

    var welcomeName = document.getElementById('welcome-name-wrap');
    if (welcomeName) welcomeName.textContent = state.currentUser ? ', ' + state.currentUser : '';

    document.getElementById('stat-games').textContent = totals.totalGames;
    document.getElementById('stat-unlocked').textContent = totals.unlockedAchv + ' / ' + totals.totalAchv;
    document.getElementById('stat-completion').textContent = totals.pct + '%';
    document.getElementById('stat-points').textContent = totals.totalPoints.toLocaleString();

    // Render live trophy breakdown
    var breakdownEl = document.getElementById('stat-trophy-breakdown');
    if (breakdownEl) {
      breakdownEl.innerHTML =
        '<span class="trophy-count-pill plat" title="Platinum Trophies">' + tierSvg('platinum') + ' ' + (totals.tiers.platinum || 0) + '</span>' +
        '<span class="trophy-count-pill gold" title="Gold Trophies">' + tierSvg('gold') + ' ' + (totals.tiers.gold || 0) + '</span>' +
        '<span class="trophy-count-pill silver" title="Silver Trophies">' + tierSvg('silver') + ' ' + (totals.tiers.silver || 0) + '</span>' +
        '<span class="trophy-count-pill bronze" title="Bronze Trophies">' + tierSvg('bronze') + ' ' + (totals.tiers.bronze || 0) + '</span>';
    }

    populatePlatforms();

    var list = games.slice();

    if (state.search.trim()) {
      var q = state.search.trim().toLowerCase();
      list = list.filter(function (g) { return g.title.toLowerCase().indexOf(q) !== -1; });
    }
    if (state.platformFilter !== 'all') {
      list = list.filter(function (g) { return g.platform === state.platformFilter; });
    }

    if (state.sortBy === 'name') {
      list.sort(function (a, b) { return a.title.localeCompare(b.title); });
    } else if (state.sortBy === 'progress-desc') {
      list.sort(function (a, b) { return gameProgress(b).pct - gameProgress(a).pct; });
    } else if (state.sortBy === 'progress-asc') {
      list.sort(function (a, b) { return gameProgress(a).pct - gameProgress(b).pct; });
    } else {
      list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    }

    var grid = document.getElementById('game-grid');
    var emptyState = document.getElementById('dashboard-empty');

    if (games.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No games match your query</h3><p>Try clearing your search term or platform filter.</p></div>';
      return;
    }

    grid.innerHTML = list.map(function (g) {
      var prog = gameProgress(g);
      var plat = platformById(g.platform);
      var r = 24;
      var circumference = 2 * Math.PI * r;
      var offset = ringDashoffset(prog.pct, r);
      var tierCounts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
      (g.achievements || []).forEach(function (a) {
        if (a.unlocked && tierCounts[a.tier] !== undefined) tierCounts[a.tier]++;
      });
      var accessionNum = games.indexOf(g) + 1;

      return '<div class="game-card" data-id="' + g.id + '">' +
        '<div class="accession">No. ' + pad3(accessionNum) + '</div>' +
        '<div class="gc-top">' +
        '<div class="medallion">' +
        '<svg viewBox="0 0 58 58">' +
        '<circle class="ring-bg" cx="29" cy="29" r="' + r + '"/>' +
        '<circle class="ring-fg" cx="29" cy="29" r="' + r + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/>' +
        '</svg>' +
        '<div class="pct">' + prog.pct + '%</div>' +
        '</div>' +
        '<div class="gc-title-wrap">' +
        '<div class="gc-title" title="' + esc(g.title) + '">' + esc(g.title) + '</div>' +
        '<div class="platform-tag"><span class="platform-dot" style="background:' + plat.color + '"></span>' + plat.label + '</div>' +
        '</div>' +
        '</div>' +
        '<div>' +
        '<div class="gc-progress-text"><b>' + prog.unlocked + '</b> / ' + prog.total + ' unlocked (' + prog.points + ' pts)</div>' +
        '<div class="gc-bar"><div class="gc-bar-fill" style="width:' + prog.pct + '%"></div></div>' +
        '</div>' +
        '<div class="gc-tiers">' +
        '<span>' + tierSvg('platinum') + ' ' + tierCounts.platinum + '</span>' +
        '<span>' + tierSvg('gold') + ' ' + tierCounts.gold + '</span>' +
        '<span>' + tierSvg('silver') + ' ' + tierCounts.silver + '</span>' +
        '<span>' + tierSvg('bronze') + ' ' + tierCounts.bronze + '</span>' +
        '</div>' +
        '</div>';
    }).join('');

    grid.querySelectorAll('.game-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-id');
        window.pgGo('game', '#' + id);
      });
    });
  }

  function importCatalogGame(catGame) {
    if (!catGame || !state.cabinet) return;

    var newGame = {
      id: uid(),
      title: catGame.title,
      platform: catGame.platform || 'playstation',
      color: catGame.color || PROFILE_COLORS[0],
      createdAt: Date.now(),
      roadmap: catGame.roadmap ? JSON.parse(JSON.stringify(catGame.roadmap)) : null,
      achievements: (catGame.achievements || []).map(function (a) {
        return {
          id: uid(),
          name: a.name,
          description: a.description,
          guide: a.guide || '',
          tier: a.tier || 'bronze',
          tag: a.tag || 'Story',
          unlocked: false,
          unlockedAt: null
        };
      })
    };

    state.cabinet.games.push(newGame);
    save();
    renderDashboard();
    toast('"' + catGame.title + '" (' + newGame.achievements.length + ' trophies) added!');
  }

  function bindEvents() {
    var pfpInput = document.getElementById('pfp-file-input');
    if (pfpInput) {
      pfpInput.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            toast('Please choose an image under 2MB.');
            return;
          }
          var reader = new FileReader();
          reader.onload = function (evt) {
            state.newProfileAvatar = evt.target.result;
            updatePfpPreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    var nameInput = document.getElementById('new-profile-name');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        updatePfpPreview();
      });
    }

    var createBtn = document.getElementById('btn-create-profile');
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        var input = document.getElementById('new-profile-name');
        var name = input.value.trim();
        if (!name) {
          input.focus();
          return;
        }
        if (state.profiles.some(function (p) { return p.username.toLowerCase() === name.toLowerCase(); })) {
          toast('Profile name taken. Try another.');
          return;
        }
        var p = {
          username: name,
          color: state.newProfileColor,
          avatar: state.newProfileAvatar,
          createdAt: Date.now()
        };
        state.profiles.push(p);
        setProfiles(state.profiles);
        var cab = { profile: p, games: [] };
        setCabinetData(name, cab);
        state.currentUser = name;
        state.cabinet = cab;
        setLastUser(name);
        input.value = '';
        state.newProfileAvatar = null;
        showMain();
        toast('Welcome to Proglog, ' + name + '!');
      });
    }

    // Sign-out is handled globally by shell.js (initSignOut), which also
    // signs out of Firebase — not just this in-page state.

    var searchInput = document.getElementById('search-games');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        state.search = e.target.value;
        renderDashboard();
      });
    }

    // Keyboard shortcut: '/' focuses search
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== searchInput && !document.querySelector('.modal-overlay')) {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });

    var platFilter = document.getElementById('filter-platform');
    if (platFilter) {
      platFilter.addEventListener('change', function (e) {
        state.platformFilter = e.target.value;
        renderDashboard();
      });
    }

    var sortSel = document.getElementById('sort-games');
    if (sortSel) {
      sortSel.addEventListener('change', function (e) {
        state.sortBy = e.target.value;
        renderDashboard();
      });
    }

    function onAddGameClick() {
      showGameModal(null, function (formData) {
        var catalog = formData.catalogGame;
        var newGame = {
          id: uid(),
          catalogId: catalog ? catalog.id : null,
          title: formData.title,
          platform: formData.platform,
          color: formData.color,
          createdAt: Date.now(),
          achievements: catalog ? JSON.parse(JSON.stringify(catalog.achievements || [])) : []
        };
        state.cabinet.games.push(newGame);
        save();
        renderDashboard();
        toast(catalog ? '"' + formData.title + '" added with its trophy checklist.' : '"' + formData.title + '" added.');
      });
    }

    var addBtn = document.getElementById('btn-add-game');
    if (addBtn) addBtn.addEventListener('click', onAddGameClick);

    var addEmptyBtn = document.getElementById('btn-add-game-empty');
    if (addEmptyBtn) addEmptyBtn.addEventListener('click', onAddGameClick);

    // Browse catalog triggers
    function onBrowseCatalogClick() {
      showCatalogModal(importCatalogGame);
    }

    var browseBtn = document.getElementById('btn-browse-catalog');
    if (browseBtn) browseBtn.addEventListener('click', onBrowseCatalogClick);

    var browseEmptyBtn = document.getElementById('btn-browse-catalog-empty');
    if (browseEmptyBtn) browseEmptyBtn.addEventListener('click', onBrowseCatalogClick);
  }

  // start
  authReady().then(function () { init(); });
})();
