// Proglog Hunter Profile & Stats Controller
(function() {
  'use strict';

  var currentUser = null;
  var cabinet = null;

  function init() {
    var session = getCurrentSession();

    if (session && !session.setupComplete) {
      window.pgGo('auth');
      return;
    }

    // Prefer a full account session, but fall back to a locally-created
    // profile (the no-email "quick profile" option on app.html never
    // creates a session, so this page needs to recognize it too).
    currentUser = session ? session.username : getLastUser();
    if (!currentUser) {
      window.pgGo('overview');
      return;
    }

    cabinet = getCabinetData(currentUser);
    if (!cabinet) {
      window.pgGo('overview');
      return;
    }

    var themeColor = (cabinet.profile && cabinet.profile.color) || (session && session.color);
    if (window.applyProglogTheme) window.applyProglogTheme(themeColor);

    bindEvents();
    render();
  }

  function save() {
    if (currentUser && cabinet) {
      setCabinetData(currentUser, cabinet);
    }
  }

  function render() {
    var p = cabinet.profile || { username: currentUser, color: PROFILE_COLORS[0], createdAt: Date.now() };
    var games = cabinet.games || [];
    var totals = cabinetTotals(games);
    var lvl = calculateHunterLevel(totals);

    // Topbar
    var avSlot = document.getElementById('topbar-avatar-slot');
    if (avSlot) avSlot.innerHTML = avatarHtml(p);
    var sideAv = document.getElementById('profile-sidebar-avatar');
    if (sideAv) sideAv.innerHTML = avatarHtml(p);
    var nameEl = document.getElementById('topbar-name');
    if (nameEl) nameEl.textContent = p.username;
    var sideName = document.getElementById('profile-sidebar-name');
    if (sideName) sideName.textContent = p.username;

    var nameInput = document.getElementById('edit-profile-name');
    if (nameInput) nameInput.value = p.username || currentUser || 'Hunter';
    drawProfileSwatches((p && p.color) || PROFILE_COLORS[0]);

    // Profile Hero
    document.getElementById('profile-hero-avatar').innerHTML = avatarHtml(p, 'avatar-lg');
    document.getElementById('profile-hero-name').textContent = p.username;
    document.getElementById('profile-rank-title').textContent = lvl.rankTitle;

    var dateStr = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Recently';
    document.getElementById('profile-join-date').textContent = 'Hunter since ' + dateStr + ' • ' + games.length + ' Games in Vault';
    var miniGames = document.getElementById('profile-mini-games'); if (miniGames) miniGames.textContent = games.length;
    var miniTrophies = document.getElementById('profile-mini-trophies'); if (miniTrophies) miniTrophies.textContent = totals.totalAchv || 0;
    var miniPlats = document.getElementById('profile-mini-platinums'); if (miniPlats) miniPlats.textContent = totals.tiers.platinum || 0;
    var platformTotal = document.getElementById('profile-platform-total'); if (platformTotal) platformTotal.textContent = games.length;

    // Level & XP
    document.getElementById('profile-level-num').textContent = lvl.level;
    document.getElementById('profile-level-rank').textContent = 'Level ' + lvl.level + ' • ' + lvl.rankTitle;
    document.getElementById('profile-xp-text').textContent = lvl.totalXp.toLocaleString() + ' Total XP (' + lvl.pct + '% to Level ' + (lvl.level + 1) + ')';
    document.getElementById('profile-xp-fill').style.width = lvl.pct + '%';
    var xpPct = document.getElementById('profile-xp-percent'); if (xpPct) xpPct.textContent = lvl.pct + '%';

    // Milestone Cards
    document.getElementById('prof-stat-plat').textContent = totals.tiers.platinum || 0;
    document.getElementById('prof-stat-gold').textContent = totals.tiers.gold || 0;
    document.getElementById('prof-stat-silver').textContent = totals.tiers.silver || 0;
    document.getElementById('prof-stat-bronze').textContent = totals.tiers.bronze || 0;

    // Platinum Showcase
    renderPlatinumShowcase(games);

    // Activity Timeline
    renderActivityTimeline(games);

    // Platform Distribution
    renderPlatformDistribution(games, totals.platformCounts);

    // Sound toggle state
    var soundToggle = document.getElementById('pref-sound-toggle');
    if (soundToggle) soundToggle.checked = getSoundEnabled();
  }

  function renderPlatinumShowcase(games) {
    var showcaseGrid = document.getElementById('platinum-showcase-grid');
    var emptyEl = document.getElementById('showcase-empty');
    var countLbl = document.getElementById('showcase-count-label');

    var plats = [];
    games.forEach(function(g) {
      (g.achievements || []).forEach(function(a) {
        if (a.tier === 'platinum' && a.unlocked) {
          plats.push({ game: g, achievement: a });
        }
      });
    });

    if (countLbl) countLbl.textContent = plats.length + ' Completed';

    if (plats.length === 0) {
      showcaseGrid.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    showcaseGrid.innerHTML = plats.map(function(item) {
      return '<div class="showcase-card">' +
        tierSvg('platinum') +
        '<div class="showcase-game-title">' + esc(item.game.title) + '</div>' +
        '<span style="font-size:10.5px; color:var(--platinum); font-weight:700;">100% MASTERED</span>' +
      '</div>';
    }).join('');
  }

  function renderActivityTimeline(games) {
    var list = document.getElementById('activity-timeline-list');
    var emptyEl = document.getElementById('activity-empty');

    var history = [];
    games.forEach(function(g) {
      (g.achievements || []).forEach(function(a) {
        if (a.unlocked && a.unlockedAt) {
          history.push({ game: g, achievement: a, time: a.unlockedAt });
        }
      });
    });

    history.sort(function(a, b) { return b.time - a.time; });
    var topRecent = history.slice(0, 10);

    if (topRecent.length === 0) {
      list.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    list.innerHTML = topRecent.map(function(item) {
      var d = new Date(item.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return '<div class="activity-item">' +
        tierSvg(item.achievement.tier) +
        '<div class="achv-info">' +
          '<div class="achv-name">' + esc(item.achievement.name) + '</div>' +
          '<div class="achv-game">' + esc(item.game.title) + '</div>' +
        '</div>' +
        '<div class="achv-time">' + d + '</div>' +
      '</div>';
    }).join('');
  }

  function renderPlatformDistribution(games, platformCounts) {
    var bar = document.getElementById('platform-bar-container');
    var legend = document.getElementById('platform-legend-container');
    if (!bar || !legend) return;

    var total = games.length;
    if (total === 0) {
      bar.innerHTML = '<div style="background:var(--line); width:100%; height:100%;"></div>';
      legend.innerHTML = '<span style="color:var(--text-muted);">No games in library yet.</span>';
      return;
    }

    var segmentsHtml = '';
    var legendHtml = '';

    PLATFORMS.forEach(function(plat) {
      var count = platformCounts[plat.id] || 0;
      if (count > 0) {
        var pct = Math.round((count / total) * 100);
        segmentsHtml += '<div class="platform-bar-segment" style="width:' + pct + '%; background:' + plat.color + ';" title="' + plat.label + ': ' + count + ' (' + pct + '%)"></div>';
        legendHtml += '<span><span class="platform-dot" style="background:' + plat.color + ';"></span>' + plat.label + ' (' + count + ')</span>';
      }
    });

    bar.innerHTML = segmentsHtml;
    legend.innerHTML = legendHtml;
  }

  function drawProfileSwatches(selectedColor) {
    var wrap = document.getElementById('edit-profile-swatches');
    if (!wrap) return;
    wrap.innerHTML = '';

    PROFILE_COLORS.forEach(function(color) {
      var sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'swatch' + (color === selectedColor ? ' selected' : '');
      sw.title = 'Use ' + color + ' accent';
      sw.style.background = color;
      sw.style.borderRadius = '50%';
      sw.style.width = '28px';
      sw.style.height = '28px';
      sw.style.border = '2px solid transparent';
      sw.style.cursor = 'pointer';
      sw.addEventListener('click', function() {
        var input = document.getElementById('edit-profile-name');
        var name = input ? input.value.trim() : (cabinet.profile && cabinet.profile.username) || currentUser || 'Hunter';
        if (!name) name = 'Hunter';
        if (cabinet.profile) cabinet.profile.color = color;
        if (window.applyProglogTheme) window.applyProglogTheme(color);
        drawProfileSwatches(color);
        if (document.getElementById('profile-hero-name')) document.getElementById('profile-hero-name').textContent = name;
      });
      wrap.appendChild(sw);
    });
  }

  function saveProfileEdits() {
    if (!cabinet) return;

    var nameInput = document.getElementById('edit-profile-name');
    var nextName = nameInput ? nameInput.value.trim() : '';
    if (!nextName) {
      toast('Enter a display name before saving.');
      if (nameInput) nameInput.focus();
      return;
    }

    var selectedColor = document.querySelector('#edit-profile-swatches .swatch.selected');
    var nextColor = selectedColor ? selectedColor.style.background : (cabinet.profile && cabinet.profile.color) || PROFILE_COLORS[0];
    if (nextColor && typeof nextColor === 'string' && nextColor.indexOf('rgb') === 0) {
      var rgb = nextColor.match(/\d+/g);
      if (rgb) nextColor = '#' + Array.prototype.slice.call(rgb).map(function(v) { return Number(v).toString(16).padStart(2, '0'); }).join('');
    }

    if (!cabinet.profile) cabinet.profile = { username: currentUser, color: PROFILE_COLORS[0], createdAt: Date.now() };
    cabinet.profile.username = nextName;
    cabinet.profile.color = nextColor || PROFILE_COLORS[0];

    var profileList = getProfiles();
    profileList.forEach(function(p) {
      if (p.username === currentUser || (cabinet.profile && p.username === cabinet.profile.username && p.username !== nextName)) {
        p.username = nextName;
        p.color = cabinet.profile.color;
      }
    });
    if (!profileList.some(function(p) { return p.username === nextName; })) {
      profileList.push({ username: nextName, color: cabinet.profile.color, avatar: cabinet.profile.avatar || null, createdAt: cabinet.profile.createdAt || Date.now() });
    }
    setProfiles(profileList);

    var session = getCurrentSession();
    if (session) {
      session.username = nextName;
      session.color = cabinet.profile.color;
      cacheSession(session);
    }

    if (window.applyProglogTheme) window.applyProglogTheme(cabinet.profile.color);

    if (window.proglogFirebase && window.proglogFirebase.auth && window.proglogFirebase.auth.currentUser) {
      var authUser = window.proglogFirebase.auth.currentUser;
      var updates = {
        displayName: nextName,
        photoURL: cabinet.profile.avatar || authUser.photoURL || null
      };
      authUser.updateProfile(updates).catch(function() {});
      var db = window.proglogFirebase.db;
      if (db && db.collection) {
        db.collection('users').doc(authUser.uid).set({
          username: nextName,
          color: cabinet.profile.color,
          avatar: cabinet.profile.avatar || authUser.photoURL || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(function() {});
      }
    }

    var oldUser = currentUser;
    currentUser = nextName;
    if (oldUser !== nextName) {
      var renamedCab = getCabinetData(oldUser);
      if (renamedCab && renamedCab.profile) {
        renamedCab.profile = cabinet.profile;
        setCabinetData(nextName, renamedCab);
        localStorage.removeItem('cabinet_data_' + oldUser);
      }
    }

    save();
    render();
    toast('Profile updated!');
  }

  function bindEvents() {
    var saveBtn = document.getElementById('btn-save-profile');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveProfileEdits);
    }

    // PFP file upload on profile page
    var pfpInput = document.getElementById('profile-pfp-file');
    if (pfpInput) {
      pfpInput.addEventListener('change', function(e) {
        var file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
            toast('Please choose an image under 2MB.');
            return;
          }
          var reader = new FileReader();
          reader.onload = function(evt) {
            if (!cabinet.profile) cabinet.profile = { username: currentUser };
            cabinet.profile.avatar = evt.target.result;
            // Also update in profiles list
            var profiles = getProfiles();
            profiles.forEach(function(p) {
              if (p.username === currentUser) p.avatar = evt.target.result;
            });
            setProfiles(profiles);
            save();
            render();
            toast('Profile photo updated!');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Export JSON Backup
    var exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', function() {
        var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cabinet, null, 2));
        var downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', 'proglog_backup_' + currentUser.toLowerCase() + '.json');
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast('Backup file downloaded.');
      });
    }

    // Restore JSON Backup
    var restoreInput = document.getElementById('input-restore-file');
    if (restoreInput) {
      restoreInput.addEventListener('change', function(e) {
        var file = e.target.files && e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function(evt) {
            try {
              var parsed = JSON.parse(evt.target.result);
              if (parsed && Array.isArray(parsed.games)) {
                cabinet = parsed;
                save();
                render();
                toast('Vault successfully restored from backup!');
              } else {
                toast('Invalid backup file format.');
              }
            } catch (err) {
              toast('Error reading backup file.');
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Preferences sound toggle
    var soundToggle = document.getElementById('pref-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', function(e) {
        setSoundEnabled(e.target.checked);
        if (e.target.checked) playTrophyChime();
        toast('Trophy sound ' + (e.target.checked ? 'enabled 🔔' : 'disabled 🔕'));
      });
    }
  }

  authReady().then(function() { init(); });
})();

