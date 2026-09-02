// RAWG configuration. The API key is kept server-side in Firebase Functions.
(function () {
  'use strict';
  window.rawgConfig = {
    apiKey: 'ac06dc3b1fee487fbb1c4fab6c1c71e4',
    baseUrl: 'https://api.rawg.io/api',
    proxyUrl: '/api/rawg',
    cacheExpiry: 86400000
  };
})();
