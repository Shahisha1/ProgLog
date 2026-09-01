// Platform-aware source metadata. Counts are verified against TrueTrophies / TrueSteamAchievements.
(function () {
  'use strict';
  if (typeof GAME_CATALOG === 'undefined' || typeof GAME_DETAILS === 'undefined') return;
  GAME_CATALOG.forEach(function (g) {
    var d = GAME_DETAILS[g.id];
    if (!d) return;
    g.totalTrophies = d.counts.total;
    g.detail = d;
    g.catalogPreview = true;
    var isPS = d.platform === 'playstation';
    g.trophySource = d.source;
    g.trophySourceUrl = d.sourceUrl;
    g.trophyGuideUrl = d.guideUrl;
    g.baseTrophies = d.base;
    g.dlcTrophies = d.dlc;
    if (!g.roadmap) g.roadmap = {};
    g.roadmap.time = d.completion || g.roadmap.time;
  });
})();
