// Static-site routing helper
(function () {
  'use strict';
  var pages = {
    home: '', overview: 'pages/core/overview.html', auth: 'pages/core/auth.html', games: 'pages/games/games.html',
    game: 'pages/games/game.html', trophies: 'pages/games/trophies.html', sessions: 'pages/activity/sessions.html',
    friends: 'pages/social/friends.html', stats: 'pages/activity/stats.html', profile: 'pages/user/profile.html',
    settings: 'pages/user/settings.html', privacy: 'pages/legal/privacy.html', thankYou: 'pages/legal/thank-you.html'
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
  window.pgGo = function (name, suffix) {
    var extra = suffix;
    if (suffix && typeof suffix === 'object') {
      if (name === 'game' && suffix.id) extra = '#' + encodeURIComponent(suffix.id);
      else if (suffix.query) extra = '?' + suffix.query;
      else extra = '';
    }
    window.location.href = pgRoute(name, extra || '');
  };
})();
