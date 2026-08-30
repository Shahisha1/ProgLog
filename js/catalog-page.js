// Proglog Catalog Page Controller
(function() {
  'use strict';

  var currentUser = null;
  var cabinet = null;
  var searchQuery = '';
  var platformFilter = 'all';
  var difficultyFilter = 'all';

  function init() {
    currentUser = getLastUser();
    if (currentUser) {
      cabinet = getCabinetData(currentUser);
      var p = cabinet ? (cabinet.profile || { username: currentUser }) : { username: currentUser };
      var avSlot = document.getElementById('topbar-avatar-slot');
      if (avSlot) avSlot.innerHTML = avatarHtml(p);
      var nameEl = document.getElementById('topbar-name');
      if (nameEl) nameEl.textContent = p.username;
    } else {
      var nameEl = document.getElementById('topbar-name');
      if (nameEl) nameEl.textContent = 'Guest Hunter';
    }

    bindEvents();
    render();
  }

  function render() {
    var list = (typeof GAME_CATALOG !== 'undefined' ? GAME_CATALOG : []).slice();

    if (searchQuery.trim()) {
      var q = searchQuery.trim().toLowerCase();
      list = list.filter(function(g) {
        return (g.title || '').toLowerCase().indexOf(q) !== -1 ||
               ((g.roadmap && g.roadmap.summary) || '').toLowerCase().indexOf(q) !== -1;
      });
    }

    if (platformFilter !== 'all') {
      list = list.filter(function(g) { return g.platform === platformFilter; });
    }

    if (difficultyFilter !== 'all') {
      list = list.filter(function(g) {
        var num = parseInt(g.roadmap ? g.roadmap.difficulty : '5', 10);
        if (difficultyFilter === 'easy') return num <= 3;
        if (difficultyFilter === 'medium') return num >= 4 && num <= 6;
        if (difficultyFilter === 'hard') return num >= 7;
        return true;
      });
    }

    var grid = document.getElementById('catalog-page-grid');
    if (!grid) return;

    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><h3>No guides match your filter</h3><p>Try clearing your search query or adjusting your filters.</p></div>';
      return;
    }

    var ownedIds = {};
    if (cabinet && cabinet.games) {
      cabinet.games.forEach(function(g) {
        ownedIds[g.title.toLowerCase()] = true;
      });
    }

    grid.innerHTML = list.map(function(item) {
      var plat = platformById(item.platform);
      var rm = item.roadmap || {};
      var achvs = item.achievements || [];
      var isOwned = ownedIds[item.title.toLowerCase()];

      var tierCounts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
      achvs.forEach(function(a) {
        if (tierCounts[a.tier] !== undefined) tierCounts[a.tier]++;
      });

      return '<div class="catalog-card" style="padding:24px;">' +
        '<div class="catalog-card-head">' +
          '<div>' +
            '<span class="platform-tag" style="margin-top:0;"><span class="platform-dot" style="background:' + plat.color + '"></span>' + plat.label + '</span>' +
            '<div class="catalog-title" style="font-size:20px; margin-top:4px;">' + esc(item.title) + '</div>' +
          '</div>' +
          (isOwned
            ? '<button class="btn btn-ghost btn-sm" disabled style="opacity:0.75;">✓ In Your Vault</button>'
            : '<button class="btn btn-primary btn-sm btn-add-cat-game" data-id="' + item.id + '">+ Add to Vault</button>') +
        '</div>' +
        '<div class="roadmap-strip" style="margin-top:4px;">' +
          (rm.difficulty ? '<div class="roadmap-item"><span class="roadmap-label">Difficulty</span><span class="roadmap-val">' + esc(rm.difficulty) + '</span></div>' : '') +
          (rm.time ? '<div class="roadmap-item"><span class="roadmap-label">Time</span><span class="roadmap-val">' + esc(rm.time) + '</span></div>' : '') +
          (rm.playthroughs ? '<div class="roadmap-item"><span class="roadmap-label">Playthroughs</span><span class="roadmap-val">' + esc(rm.playthroughs) + '</span></div>' : '') +
          (rm.missable ? '<div class="roadmap-item"><span class="roadmap-label">Missables</span><span class="roadmap-val">' + esc(rm.missable) + '</span></div>' : '') +
        '</div>' +
        '<div class="gc-tiers" style="padding:2px 0;">' +
          '<span>' + tierSvg('platinum') + ' ' + tierCounts.platinum + '</span>' +
          '<span>' + tierSvg('gold') + ' ' + tierCounts.gold + '</span>' +
          '<span>' + tierSvg('silver') + ' ' + tierCounts.silver + '</span>' +
          '<span>' + tierSvg('bronze') + ' ' + tierCounts.bronze + '</span>' +
          '<span style="margin-left:auto; font-weight:700; color:var(--text-main);">' + achvs.length + ' Total Trophies</span>' +
        '</div>' +
        (rm.summary ? '<div class="catalog-desc">' + esc(rm.summary) + '</div>' : '') +
        (item.catalogPreview ? '<div class="catalog-data-note">Catalog entry · full trophy set can be synced from the connected platform.</div>' : '') +
      '</div>';
    }).join('');

    grid.querySelectorAll('.btn-add-cat-game').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.getAttribute('data-id');
        addGameToVault(id);
      });
    });
  }

  function addGameToVault(catId) {
    var catGame = getCatalogGame(catId);
    if (!catGame) return;

    if (!currentUser) {
      toast('Please create or enter a hunter profile first.');
      setTimeout(function() { window.location.href = 'app.html'; }, 1000);
      return;
    }

    if (!cabinet) {
      cabinet = {
        profile: { username: currentUser, color: PROFILE_COLORS[0], createdAt: Date.now() },
        games: []
      };
    }

    var newGame = {
      id: uid(),
      title: catGame.title,
      platform: catGame.platform || 'playstation',
      color: catGame.color || PROFILE_COLORS[0],
      createdAt: Date.now(),
      roadmap: catGame.roadmap ? JSON.parse(JSON.stringify(catGame.roadmap)) : null,
      notes: '',
      achievements: (catGame.achievements || []).map(function(a) {
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

    cabinet.games.push(newGame);
    setCabinetData(currentUser, cabinet);
    toast('"' + catGame.title + '" added to your Vault!');
    render();
  }

  function bindEvents() {
    var searchInput = document.getElementById('search-catalog');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value;
        render();
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === '/' && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      });
    }

    var platSelect = document.getElementById('filter-cat-platform');
    if (platSelect) {
      platSelect.addEventListener('change', function(e) {
        platformFilter = e.target.value;
        render();
      });
    }

    var diffSelect = document.getElementById('filter-cat-difficulty');
    if (diffSelect) {
      diffSelect.addEventListener('change', function(e) {
        difficultyFilter = e.target.value;
        render();
      });
    }
  }

  init();
})();

