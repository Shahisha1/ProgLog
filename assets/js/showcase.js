// Proglog showcase seed: makes the public demo immediately explorable without an account.
(function () {
  'use strict';
  var DEMO_USER = 'Demo Hunter';
  var DEMO_KEY = 'proglog_showcase_seeded';

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function seed() {
    if (!window.localStorage || typeof getProfiles !== 'function' || typeof setProfiles !== 'function') return false;
    try {
      var existing = typeof getCabinetData === 'function' ? getCabinetData(DEMO_USER) : null;
      var catalog = (typeof GAME_CATALOG !== 'undefined' && Array.isArray(GAME_CATALOG)) ? GAME_CATALOG : [];
      if (existing && Array.isArray(existing.games) && existing.games.length) {
        if (!getLastUser() && typeof setLastUser === 'function') setLastUser(DEMO_USER);
        return true;
      }
      var picks = ['spiderman-remastered', 'tlou-part-1', 'ghost-of-tsushima', 'cyberpunk-2077', 'god-of-war-2018'];
      var games = [];
      var now = Date.now();
      picks.forEach(function (id, idx) {
        var cat = catalog.filter(function (g) { return g.id === id; })[0];
        if (!cat || !Array.isArray(cat.achievements) || !cat.achievements.length) return;
        var achievements = clone(cat.achievements).map(function (a, i) {
          var unlocked = (i + idx) % 3 !== 0;
          return { id: a.id || ('demo-' + id + '-' + i), name: a.name, description: a.description || '', guide: a.guide || '', tier: a.tier || 'bronze', tag: a.tag || 'Story', rarity: a.rarity, playerPercentage: a.playerPercentage, unlocked: unlocked, unlockedAt: unlocked ? now - ((i + 1) * 86400000) : null };
        });
        games.push({ id: 'demo-' + id, catalogId: id, title: cat.title, platform: cat.platform || 'playstation', color: cat.color || '#16a66f', createdAt: now - ((idx + 1) * 172800000), roadmap: clone(cat.roadmap || {}), achievements: achievements, notes: '' });
      });

      if (!games.length) {
        ['Marvel’s Spider-Man Remastered', 'The Last of Us Part I', 'Cyberpunk 2077', 'Ghost of Tsushima'].forEach(function (title, i) {
          games.push({ id: 'demo-generic-' + i, title: title, platform: i === 2 ? 'steam' : 'playstation', color: '#16a66f', createdAt: now - (i + 1) * 172800000, roadmap: {}, achievements: [], notes: '' });
        });
      }
      var profile = { username: DEMO_USER, color: '#16a66f', avatar: null, createdAt: now - 86400000 * 365, setupComplete: true, showcase: true };
      if (typeof setCabinetData === 'function') setCabinetData(DEMO_USER, { profile: profile, games: games, showcase: true });
      var profiles = getProfiles().filter(function (p) { return p.username !== DEMO_USER; });
      profiles.unshift(profile);
      setProfiles(profiles);
      if (typeof setLastUser === 'function') setLastUser(DEMO_USER);
      localStorage.setItem(DEMO_KEY, '1');
      window.PROGLOG_SHOWCASE_READY = true;
      return true;
    } catch (e) { return false; }
  }

  window.PROGLOG_DEMO_USER = DEMO_USER;
  window.ensureProglogShowcase = seed;
  // Catalog.js dispatches this once the catalog has been defined, before page controllers run.
  window.addEventListener('proglog:catalog-ready', seed, { once: true });
  // Pages without a catalog still receive a lightweight demo profile.
  seed();
})();
