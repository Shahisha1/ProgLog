/* Community feed configuration. Proxies remove browser CORS/rate-limit failures. */
(function () {
  'use strict';
  window.proglogFeedConfig = {
    reddit: { subreddit: 'gaming', limit: 50, proxyUrl: '/api/reddit' },
    youtube: {
      limitPerChannel: 10, proxyUrl: '/api/youtube',
      channels: [
        { name: 'IGN', id: 'UCKy1dAqELo0zrOtPkf0eTMw' },
        { name: 'PlayStation', id: 'UC-2Y8dQb0S6DtpxNgAKoJKA' },
        { name: 'GameSpot', id: 'UCbu2SsF-Or3Rsn3NxqODImw' },
        { name: 'IGN Guides', id: 'UC4LKeEyIBI7kyntQMFXTh0Q' }
      ]
    },
    twitch: { proxyUrl: '/api/twitchStreams' }
  };
})();
