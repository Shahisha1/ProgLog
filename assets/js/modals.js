// Modal dialogs

function openModal(html) {
  closeModal(); // kill any stale modal
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = html;
  overlay.addEventListener('mousedown', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  return overlay;
}

function closeModal() {
  var overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeModal();
});

function showGameModal(existing, onSave) {
  var session = typeof getCurrentSession === 'function' ? getCurrentSession() : null;
  var selectedColor = existing ? existing.color : ((session && session.color) || PROFILE_COLORS[0]);
  var selectedPlatform = existing ? existing.platform : 'playstation';
  var selectedCatalog = null;

  var overlay = openModal(
    '<div class="modal modal-game">' +
    '<div class="modal-head">' +
    '<div>' +
    '<h3>' + (existing ? 'Edit Game' : 'Add Game to Vault') + '</h3>' +
    '<div class="modal-subtitle">' + (existing ? 'Update this entry in your game library.' : 'Search the catalog or add a custom game.') + '</div>' +
    '</div>' +
    '<button class="modal-close" id="modal-close-btn" aria-label="Close">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body">' +
    '<div class="field game-search-field">' +
    '<label class="field-label" for="input-game-title">Game Title</label>' +
    '<div class="game-search-box">' +
    '<svg class="game-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>' +
    '<input type="text" id="input-game-title" maxlength="80" autocomplete="off" placeholder="Search for a game…" value="' + (existing ? esc(existing.title) : '') + '">' +
    '<span class="search-loader hidden" id="game-search-loader" aria-hidden="true"></span>' +
    '</div>' +
    '<div class="game-suggestions hidden" id="game-suggestions" role="listbox" aria-label="Game suggestions"></div>' +
    '<div class="selected-game-note hidden" id="selected-game-note"></div>' +
    '</div>' +
    '<div class="field">' +
    '<label class="field-label">Platform</label>' +
    '<select id="input-game-platform">' +
    PLATFORMS.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === selectedPlatform ? ' selected' : '') + '>' + p.label + '</option>';
    }).join('') +
    '</select>' +
    '</div>' +
    '<div class="field">' +
    '<label class="field-label">Theme Color</label>' +
    '<div class="color-picker" id="game-color-picker"></div>' +
    '</div>' +
    '</div>' +
    '<div class="modal-foot">' +
    '<button class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>' +
    '<button class="btn btn-primary" id="modal-save-btn">' + (existing ? 'Save Changes' : 'Add to Vault') + '</button>' +
    '</div>' +
    '</div>'
  );

  var colorPicker = overlay.querySelector('#game-color-picker');
  function drawColors() {
    colorPicker.innerHTML = '';
    PROFILE_COLORS.forEach(function (c) {
      var sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'swatch' + (c === selectedColor ? ' selected' : '');
      sw.style.background = c;
      sw.setAttribute('aria-label', 'Choose ' + c + '');
      sw.addEventListener('click', function () {
        selectedColor = c;
        drawColors();
      });
      colorPicker.appendChild(sw);
    });
  }
  drawColors();

  var titleInput = overlay.querySelector('#input-game-title');
  var suggestions = overlay.querySelector('#game-suggestions');
  var loader = overlay.querySelector('#game-search-loader');
  var selectedNote = overlay.querySelector('#selected-game-note');
  var platformInput = overlay.querySelector('#input-game-platform');

  function clearSelectedCatalog() {
    selectedCatalog = null;
    selectedNote.classList.add('hidden');
    selectedNote.innerHTML = '';
  }

  function similarityScore(query, title) {
    var q = query.toLowerCase().trim();
    var t = title.toLowerCase();
    if (!q) return 0;
    if (t === q) return 1000;
    if (t.indexOf(q) === 0) return 900 - Math.min(100, t.length - q.length);
    if (t.indexOf(q) !== -1) return 700 - t.indexOf(q);
    var tokens = q.split(/\s+/).filter(Boolean);
    var matched = tokens.filter(function (token) { return t.indexOf(token) !== -1; }).length;
    if (matched) return 500 + (matched / tokens.length) * 100;
    // Small typo tolerance for short searches.
    var compactQ = q.replace(/[^a-z0-9]/g, '');
    var compactT = t.replace(/[^a-z0-9]/g, '');
    if (compactQ.length >= 4) {
      for (var i = 0; i <= compactT.length - compactQ.length; i++) {
        var misses = 0;
        for (var j = 0; j < compactQ.length; j++) {
          if (compactT[i + j] !== compactQ[j]) misses++;
          if (misses > 1) break;
        }
        if (misses <= 1) return 300;
      }
    }
    return 0;
  }

  function renderSuggestions(query) {
    if (existing || typeof GAME_CATALOG === 'undefined' || !query.trim()) {
      suggestions.classList.add('hidden');
      return;
    }
    var results = GAME_CATALOG.map(function (item) {
      return { item: item, score: similarityScore(query, item.title) };
    }).filter(function (x) { return x.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 6);

    if (!results.length) {
      suggestions.innerHTML = '<div class="game-suggestions-empty">No catalog matches. You can still add <strong>' + esc(query.trim()) + '</strong> as a custom game.</div>';
      suggestions.classList.remove('hidden');
      return;
    }

    suggestions.innerHTML = results.map(function (result, index) {
      var item = result.item;
      var plat = platformById(item.platform);
      var count = (item.achievements || []).length;
      return '<button type="button" class="game-suggestion" role="option" data-index="' + index + '">' +
        '<span class="game-suggestion-art" style="background:' + esc(item.color || selectedColor) + '">' + esc(initials(item.title)) + '</span>' +
        '<span class="game-suggestion-copy"><strong>' + esc(item.title) + '</strong><span><i style="background:' + esc(plat.color) + '"></i>' + esc(plat.label) + (count ? ' · ' + count + ' trophies' : '') + '</span></span>' +
        '<span class="game-suggestion-arrow">↵</span>' +
        '</button>';
    }).join('');
    suggestions.classList.remove('hidden');

    suggestions.querySelectorAll('.game-suggestion').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var result = results[Number(btn.getAttribute('data-index'))];
        if (!result) return;
        selectCatalogGame(result.item);
      });
    });
  }

  function selectCatalogGame(item) {
    selectedCatalog = item;
    titleInput.value = item.title;
    platformInput.value = item.platform;
    selectedColor = item.color || selectedColor;
    drawColors();
    suggestions.classList.add('hidden');
    loader.classList.remove('hidden');
    selectedNote.classList.add('hidden');
    setTimeout(function () {
      loader.classList.add('hidden');
      var count = (item.achievements || []).length;
      selectedNote.innerHTML = '<span class="selected-game-check">✓</span><span><strong>Catalog game selected</strong><small>' + esc(platformById(item.platform).label) + (count ? ' · ' + count + ' trophies will be added' : '') + '</small></span>';
      selectedNote.classList.remove('hidden');
    }, 120);
  }

  overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);

  titleInput.addEventListener('input', function () {
    if (selectedCatalog && titleInput.value.trim() !== selectedCatalog.title) clearSelectedCatalog();
    renderSuggestions(titleInput.value);
  });
  titleInput.addEventListener('focus', function () {
    if (titleInput.value.trim()) renderSuggestions(titleInput.value);
  });
  titleInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      suggestions.classList.add('hidden');
      return;
    }
    if (e.key === 'Enter' && !suggestions.classList.contains('hidden')) {
      var first = suggestions.querySelector('.game-suggestion');
      if (first) {
        e.preventDefault();
        first.click();
      }
    }
  });
  document.addEventListener('mousedown', function onOutside(e) {
    if (!overlay.contains(e.target)) return;
    if (!e.target.closest('.game-search-field')) suggestions.classList.add('hidden');
  });

  titleInput.focus();

  overlay.querySelector('#modal-save-btn').addEventListener('click', function () {
    var title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return;
    }
    var platform = platformInput.value;
    closeModal();
    if (typeof onSave === 'function') {
      onSave({
        title: title,
        platform: platform,
        color: selectedColor,
        catalogGame: selectedCatalog
      });
    }
  });
}

function showAchvModal(existing, onSave) {
  var selectedTier = existing ? existing.tier : 'bronze';
  var selectedTag = existing && existing.tag ? existing.tag : 'Story';
  var TAG_OPTIONS = ['Story', 'Collectible', 'Combat', 'DLC', 'Missable'];

  var overlay = openModal(
    '<div class="modal">' +
    '<div class="modal-head">' +
    '<h3>' + (existing ? 'Edit Trophy' : 'Add New Trophy') + '</h3>' +
    '<button class="modal-close" id="modal-close-btn" aria-label="Close">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body">' +
    '<div class="field">' +
    '<label class="field-label">Trophy Name</label>' +
    '<input type="text" id="input-achv-name" maxlength="80" placeholder="e.g. It can\'t be for nothing" value="' + (existing ? esc(existing.name) : '') + '">' +
    '</div>' +
    '<div class="field">' +
    '<label class="field-label">Description / Requirement</label>' +
    '<textarea id="input-achv-desc" maxlength="240" placeholder="What is required to earn this trophy?">' + (existing ? esc(existing.description || '') : '') + '</textarea>' +
    '</div>' +
    '<div class="field">' +
    '<label class="field-label">Unlock Guide / Strategy (Optional)</label>' +
    '<textarea id="input-achv-guide" maxlength="400" placeholder="Step-by-step tips or chapter locations">' + (existing ? esc(existing.guide || '') : '') + '</textarea>' +
    '</div>' +
    '<div class="field">' +
    '<label class="field-label">Trophy Tier</label>' +
    '<div class="tier-select" id="tier-select"></div>' +
    '</div>' +
    '<div class="field">' +
    '<label class="field-label">Category Tag</label>' +
    '<select id="input-achv-tag">' +
    TAG_OPTIONS.map(function (t) {
      return '<option value="' + t + '"' + (t === selectedTag ? ' selected' : '') + '>' + t + '</option>';
    }).join('') +
    '</select>' +
    '</div>' +
    '<div class="field" style="margin-bottom:0;">' +
    '<label style="display:flex; align-items:center; gap:10px; cursor:pointer;">' +
    '<input type="checkbox" id="input-achv-unlocked" style="width:auto;" ' + (existing && existing.unlocked ? 'checked' : '') + '>' +
    '<span style="font-size:14px; font-weight:600;">Mark as already unlocked</span>' +
    '</label>' +
    '</div>' +
    '</div>' +
    '<div class="modal-foot">' +
    '<button class="btn btn-ghost" id="modal-cancel-btn">Cancel</button>' +
    '<button class="btn btn-primary" id="modal-save-btn">' + (existing ? 'Save Changes' : 'Add Trophy') + '</button>' +
    '</div>' +
    '</div>'
  );

  var tierSelect = overlay.querySelector('#tier-select');
  function drawTiers() {
    tierSelect.innerHTML = '';
    TIERS.forEach(function (t) {
      var opt = document.createElement('div');
      opt.className = 'tier-opt' + (t.id === selectedTier ? ' selected' : '');
      opt.style.color = t.color;
      opt.innerHTML = tierSvg(t.id) + '<span>' + t.label + '</span>';
      opt.addEventListener('click', function () {
        selectedTier = t.id;
        drawTiers();
      });
      tierSelect.appendChild(opt);
    });
  }
  drawTiers();

  overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);

  var nameInput = overlay.querySelector('#input-achv-name');
  nameInput.focus();

  overlay.querySelector('#modal-save-btn').addEventListener('click', function () {
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    var desc = overlay.querySelector('#input-achv-desc').value.trim();
    var guide = overlay.querySelector('#input-achv-guide').value.trim();
    var tag = overlay.querySelector('#input-achv-tag').value;
    var unlocked = overlay.querySelector('#input-achv-unlocked').checked;

    closeModal();
    if (typeof onSave === 'function') {
      onSave({
        name: name,
        description: desc,
        guide: guide,
        tier: selectedTier,
        tag: tag,
        unlocked: unlocked
      });
    }
  });
}

function showCatalogModal(onSelectGame) {
  var catalogList = typeof GAME_CATALOG !== 'undefined' ? GAME_CATALOG : [];

  var cardsHtml = catalogList.map(function (item) {
    var plat = platformById(item.platform);
    var achvCount = (item.achievements || []).length;
    var rm = item.roadmap || {};

    return '<div class="catalog-card" data-cat-id="' + item.id + '">' +
      '<div class="catalog-card-head">' +
      '<div>' +
      '<div class="catalog-title">' +
      esc(item.title) +
      '</div>' +
      '<span class="platform-tag"><span class="platform-dot" style="background:' + plat.color + '"></span>' + plat.label + '</span>' +
      '</div>' +
      '<button class="btn btn-primary btn-sm btn-import-cat" data-id="' + item.id + '">' +
      '+ Add to Vault' +
      '</button>' +
      '</div>' +
      '<div class="catalog-stats-row">' +
      '<span><b>' + achvCount + '</b> Trophies</span>' +
      (rm.difficulty ? '<span>Difficulty: <b>' + rm.difficulty + '</b></span>' : '') +
      (rm.time ? '<span>Time: <b>' + rm.time + '</b></span>' : '') +
      (rm.playthroughs ? '<span><b>' + rm.playthroughs + '</b></span>' : '') +
      '</div>' +
      (rm.summary ? '<div class="catalog-desc">' + esc(rm.summary) + '</div>' : '') +
      '</div>';
  }).join('');

  var overlay = openModal(
    '<div class="modal" style="max-width:560px;">' +
    '<div class="modal-head">' +
    '<div>' +
    '<h3>Trophy Guide Catalog</h3>' +
    '<div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Starter roadmap checklists in the style of PlatGet &amp; PlayStationTrophies</div>' +
    '</div>' +
    '<button class="modal-close" id="modal-close-btn" aria-label="Close">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    '</button>' +
    '</div>' +
    '<div class="modal-body">' +
    '<div class="catalog-list">' + cardsHtml + '</div>' +
    '</div>' +
    '<div class="modal-foot">' +
    '<button class="btn btn-ghost" id="modal-cancel-btn">Close</button>' +
    '</div>' +
    '</div>'
  );

  overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);

  overlay.querySelectorAll('.btn-import-cat').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var id = btn.getAttribute('data-id');
      var chosen = getCatalogGame(id);
      if (chosen && typeof onSelectGame === 'function') {
        closeModal();
        onSelectGame(chosen);
      }
    });
  });
}
