// Utilities: colors, avatars, levels, sound

var PLATFORMS = [
  { id: 'playstation', label: 'PlayStation', color: '#38bdf8' },
  { id: 'steam', label: 'Steam', color: '#60a5fa' },
  { id: 'xbox', label: 'Xbox', color: '#4ade80' },
  { id: 'nintendo', label: 'Nintendo', color: '#f87171' },
  { id: 'pc', label: 'PC (Epic / GOG)', color: '#c084fc' },
  { id: 'mobile', label: 'Mobile', color: '#fbbf24' },
  { id: 'other', label: 'Other', color: '#94a3b8' }
];

var TIERS = [
  { id: 'platinum', label: 'Platinum', color: 'var(--platinum)', points: 120, xp: 300, icon: '🏆' },
  { id: 'gold', label: 'Gold', color: 'var(--gold)', points: 60, xp: 90, icon: '🥇' },
  { id: 'silver', label: 'Silver', color: 'var(--silver)', points: 30, xp: 30, icon: '🥈' },
  { id: 'bronze', label: 'Bronze', color: 'var(--bronze)', points: 15, xp: 15, icon: '🥉' }
];

var PROFILE_COLORS = [
  '#16a66f', '#3b82f6', '#7567d9', '#e05268',
  '#d89b1d', '#9a63d6', '#e57b38', '#20b8ae'
];

function platformById(id) {
  for (var i = 0; i < PLATFORMS.length; i++) {
    if (PLATFORMS[i].id === id) return PLATFORMS[i];
  }
  return PLATFORMS[0];
}

function tierById(id) {
  for (var i = 0; i < TIERS.length; i++) {
    if (TIERS[i].id === id) return TIERS[i];
  }
  return TIERS[3]; // bronze default
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function initials(name) {
  var parts = String(name).trim().split(/\s+/);
  if (!parts[0]) return 'PV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function pad3(n) {
  n = String(n);
  while (n.length < 3) n = '0' + n;
  return n;
}

// Generate Avatar markup supporting custom PFP image or initials
function avatarHtml(profile, sizeClass) {
  var cls = 'avatar' + (sizeClass ? ' ' + sizeClass : '');
  if (!profile) {
    return '<div class="' + cls + '">PV</div>';
  }
  if (profile.avatar) {
    return '<div class="' + cls + '"><img src="' + esc(profile.avatar) + '" alt="' + esc(profile.username) + '"></div>';
  }
  var bg = profile.color || PROFILE_COLORS[0];
  return '<div class="' + cls + '" style="background:' + bg + ';">' + esc(initials(profile.username)) + '</div>';
}

// Modern High-Definition Trophy Badges
function tierSvg(tierId) {
  if (tierId === 'platinum') {
    return '<div class="tier-badge" title="Platinum Trophy">' +
      '<svg viewBox="0 0 24 24" fill="none">' +
        '<circle cx="12" cy="12" r="10" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" stroke-width="1.5"/>' +
        '<path d="M12 4L14.5 9.5L20 10.3L16 14.2L17 19.7L12 17L7 19.7L8 14.2L4 10.3L9.5 9.5L12 4Z" fill="#38bdf8"/>' +
        '<circle cx="12" cy="12" r="2.5" fill="#ffffff" opacity="0.9"/>' +
      '</svg>' +
    '</div>';
  } else if (tierId === 'gold') {
    return '<div class="tier-badge" title="Gold Trophy">' +
      '<svg viewBox="0 0 24 24" fill="none">' +
        '<circle cx="12" cy="12" r="10" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" stroke-width="1.5"/>' +
        '<path d="M7 6H17V9C17 11.8 14.8 14 12 14C9.2 14 7 11.8 7 9V6Z" fill="#fbbf24"/>' +
        '<path d="M10 14V17H14V14" stroke="#fbbf24" stroke-width="1.8" stroke-linecap="round"/>' +
        '<rect x="8" y="17" width="8" height="2" rx="1" fill="#fbbf24"/>' +
        '<path d="M7 7.5H5C4.4 7.5 4 7.9 4 8.5C4 9.6 4.9 10.5 6 10.5H7M17 7.5H19C19.6 7.5 20 7.9 20 8.5C20 9.6 19.1 10.5 18 10.5H17" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg>' +
    '</div>';
  } else if (tierId === 'silver') {
    return '<div class="tier-badge" title="Silver Trophy">' +
      '<svg viewBox="0 0 24 24" fill="none">' +
        '<circle cx="12" cy="12" r="10" fill="rgba(203,213,225,0.15)" stroke="#cbd5e1" stroke-width="1.5"/>' +
        '<path d="M12 4.5L18 7.5V12.5C18 16.5 15.4 19.2 12 20C8.6 19.2 6 16.5 6 12.5V7.5L12 4.5Z" fill="#cbd5e1"/>' +
        '<path d="M12 7.5L15 9V12.5C15 14.8 13.5 16.5 12 17V7.5Z" fill="#94a3b8" opacity="0.6"/>' +
      '</svg>' +
    '</div>';
  } else {
    return '<div class="tier-badge" title="Bronze Trophy">' +
      '<svg viewBox="0 0 24 24" fill="none">' +
        '<circle cx="12" cy="12" r="10" fill="rgba(251,146,60,0.15)" stroke="#fb923c" stroke-width="1.5"/>' +
        '<circle cx="12" cy="12" r="6" fill="#fb923c"/>' +
        '<polygon points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15.2 9,17 9.5,13.5 7,11 10.5,10.5" fill="#7c2d12" opacity="0.55"/>' +
      '</svg>' +
    '</div>';
  }
}

function gameProgress(game) {
  var achvs = (game && game.achievements) ? game.achievements : [];
  var total = achvs.length;
  var unlocked = achvs.filter(function(a) { return a.unlocked; }).length;
  var pct = total === 0 ? 0 : Math.round((unlocked / total) * 100);
  var points = achvs.filter(function(a) { return a.unlocked; })
    .reduce(function(sum, a) { return sum + tierById(a.tier).points; }, 0);
  return { total: total, unlocked: unlocked, pct: pct, points: points };
}

function cabinetTotals(games) {
  var totalAchv = 0, unlockedAchv = 0, totalPoints = 0, totalXp = 0;
  var tiers = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  var platformCounts = {};
  var gList = games || [];
  
  gList.forEach(function(g) {
    var p = gameProgress(g);
    totalAchv += p.total;
    unlockedAchv += p.unlocked;
    totalPoints += p.points;
    platformCounts[g.platform] = (platformCounts[g.platform] || 0) + 1;
    (g.achievements || []).forEach(function(a) {
      if (a.unlocked && tiers[a.tier] !== undefined) {
        tiers[a.tier]++;
        totalXp += tierById(a.tier).xp || 15;
      }
    });
  });
  
  var pct = totalAchv === 0 ? 0 : Math.round((unlockedAchv / totalAchv) * 100);
  return {
    totalGames: gList.length,
    totalAchv: totalAchv,
    unlockedAchv: unlockedAchv,
    pct: pct,
    totalPoints: totalPoints,
    totalXp: totalXp,
    tiers: tiers,
    platformCounts: platformCounts
  };
}

// Calculate Hunter Level & Progress
function calculateHunterLevel(totals) {
  var xp = totals.totalXp || 0;
  // Level formula: Level = floor(sqrt(xp / 100)) + 1
  var level = Math.floor(Math.sqrt(xp / 60)) + 1;
  var currentLevelBaseXp = Math.pow(level - 1, 2) * 60;
  var nextLevelBaseXp = Math.pow(level, 2) * 60;
  var levelXpRequired = nextLevelBaseXp - currentLevelBaseXp;
  var currentXpInLevel = xp - currentLevelBaseXp;
  var pct = levelXpRequired <= 0 ? 100 : Math.min(100, Math.round((currentXpInLevel / levelXpRequired) * 100));

  var rankTitle = 'Novice Hunter';
  if (level >= 50) rankTitle = 'Mythic Trophy Legend';
  else if (level >= 35) rankTitle = 'Master Completionist';
  else if (level >= 20) rankTitle = 'Platinum Vanguard';
  else if (level >= 10) rankTitle = 'Expert Hunter';
  else if (level >= 5) rankTitle = 'Skilled Achiever';

  return {
    level: level,
    rankTitle: rankTitle,
    totalXp: xp,
    currentXpInLevel: currentXpInLevel,
    levelXpRequired: levelXpRequired,
    pct: pct
  };
}

function ringDashoffset(pct, r) {
  var circumference = 2 * Math.PI * r;
  return circumference - (pct / 100) * circumference;
}

function toast(msg) {
  var wrap = document.getElementById('toast-wrap');
  if (!wrap) return;
  var el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<span class="dot"></span>' + esc(msg);
  wrap.appendChild(el);
  setTimeout(function() {
    el.style.transition = 'opacity .25s ease, transform .25s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(function() { el.remove(); }, 260);
  }, 2300);
}

// Web Audio API Trophy Unlock Chime Synth
var _audioCtx = null;
function getSoundEnabled() {
  return localStorage.getItem('proglog_sound') !== 'false';
}

function setSoundEnabled(enabled) {
  try {
    localStorage.setItem('proglog_sound', enabled ? 'true' : 'false');
    localStorage.setItem('proglog_pref_sound', enabled ? 'true' : 'false');
  } catch (e) {}
  if (window.proglogCloud && window.proglogCloud.savePreferences) {
    window.proglogCloud.savePreferences({ soundEnabled: !!enabled }).catch(function () {});
  }
}

function playTrophyChime() {
  if (!getSoundEnabled()) return;
  try {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!_audioCtx) _audioCtx = new AudioContext();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    var now = _audioCtx.currentTime;
    
    // Harmony chord frequencies: E6, G#6, B6
    var freqs = [1318.51, 1661.22, 1975.53];
    freqs.forEach(function(f, idx) {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + (idx * 0.04));

      gain.gain.setValueAtTime(0.001, now + (idx * 0.04));
      gain.gain.exponentialRampToValueAtTime(0.12, now + (idx * 0.04) + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.04) + 0.9);

      osc.connect(gain);
      gain.connect(_audioCtx.destination);

      osc.start(now + (idx * 0.04));
      osc.stop(now + (idx * 0.04) + 0.95);
    });
  } catch (e) {
    // Audio context not allowed without interaction, fail gracefully
  }
}
