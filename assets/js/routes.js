/* Proglog static-site routing helper. Works on GitHub Pages project sites and custom domains. */
(function () {
  'use strict';
  var pages = {
    home: '', overview: 'pages/overview/overview.html', auth: 'pages/auth/auth.html', games: 'pages/games/games.html',
    game: 'pages/game/game.html', trophies: 'pages/trophies/trophies.html', sessions: 'pages/sessions/sessions.html',
    friends: 'pages/friends/friends.html', stats: 'pages/stats/stats.html', profile: 'pages/profile/profile.html',
    settings: 'pages/settings/settings.html', privacy: 'pages/privacy/privacy.html', thankYou: 'pages/thank-you/thank-you.html'
  };
  function siteBase() {
    var p = window.location.pathname || '/';
    var marker = '/pages/';
    var i = p.indexOf(marker);
    if (i >= 0) return p.slice(0, i);
    return p.replace(/\/[^\/]*$/, '');
  }
  window.pgRoute = function (name, suffix) {
    var base = siteBase();
    var path = pages[name];
    if (path === undefined) path = pages.overview;
    if (name === 'home') return (base || '') + '/';
    return (base || '') + '/' + path + (suffix || '');
  };
  window.pgGo = function (name, suffix) { window.location.href = pgRoute(name, suffix); };
})();
