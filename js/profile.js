// Proglog Hunter Profile & Stats Controller
(function() {
  'use strict';

  var currentUser = null;
  var cabinet = null;

  function init() {
    var session = getCurrentSession();

    if (session && !session.setupComplete) {
      window.location.href = 'auth.html';
      return;
    }

    // Prefer a full account session, but fall back to a locally-created
    // profile (the no-email "quick profile" option on app.html never
    // creates a session, so this page needs to recognize it too).
    currentUser = session ? session.username : getLastUser();
    if (!currentUser) {
      window.location.href = 'app.html';
      return;
    }

    cabinet = getCabinetData(currentUser);
    if (!cabinet) {
      window.location.href = 'app.html';
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
    var nameEl = document.getElementById('topbar-name');
    if (nameEl) nameEl.textContent = p.username;

    // Profile Hero
    document.getElementById('profile-hero-avatar').innerHTML = avatarHtml(p, 'avatar-lg');
    document.getElementById('profile-hero-name').textContent = p.username;
    document.getElementById('profile-rank-title').textContent = lvl.rankTitle;

    var dateStr = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Recently';
    document.getElementById('profile-join-date').textContent = 'Hunter since ' + dateStr + ' • ' + games.length + ' Games in Vault';

    // Level & XP
    document.getElementById('profile-level-num').textContent = lvl.level;
    document.getElementById('profile-level-rank').textContent = 'Level ' + lvl.level + ' • ' + lvl.rankTitle;
    document.getElementById('profile-xp-text').textContent = lvl.totalXp.toLocaleString() + ' Total XP (' + lvl.pct + '% to Level ' + (lvl.level + 1) + ')';
    document.getElementById('profile-xp-fill').style.width = lvl.pct + '%';

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

  function bindEvents() {
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

