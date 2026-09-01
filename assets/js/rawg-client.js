// RAWG.io API client
(function () {
    'use strict';

    var requestQueue = {};

    function getCacheKey(query) {
        return 'rawg_' + String(query).toLowerCase().replace(/\W+/g, '_');
    }

    function getCached(query) {
        try {
            var key = getCacheKey(query);
            var item = localStorage.getItem(key);
            if (!item) return null;
            var data = JSON.parse(item);
            if (data.expires && data.expires < Date.now()) {
                localStorage.removeItem(key);
                return null;
            }
            return data.value;
        } catch (e) {
            return null;
        }
    }

    function setCached(query, value) {
        try {
            var key = getCacheKey(query);
            var config = window.rawgConfig || { cacheExpiry: 86400000 };
            localStorage.setItem(key, JSON.stringify({
                value: value,
                expires: Date.now() + config.cacheExpiry
            }));
        } catch (e) { }
    }

    function fetchAPI(endpoint, callback) {
        if (!window.rawgConfig) {
            if (callback) callback(null, 'RAWG config not loaded');
            return;
        }

        var url = window.rawgConfig.baseUrl + endpoint + (endpoint.indexOf('?') > -1 ? '&' : '?') + 'key=' + window.rawgConfig.apiKey;

        fetch(url)
            .then(function (response) {
                if (!response.ok) throw new Error('API error: ' + response.status);
                return response.json();
            })
            .then(function (data) { if (callback) callback(data, null); })
            .catch(function (error) { if (callback) callback(null, error); });
    }

    function searchGames(query, callback) {
        var cached = getCached('search_' + query);
        if (cached) {
            if (callback) callback(cached, null);
            return;
        }

        if (requestQueue[query]) {
            if (callback) requestQueue[query].push(callback);
            return;
        }

        requestQueue[query] = [callback || function () { }];
        var endpoint = '/games?search=' + encodeURIComponent(query) + '&page_size=5';

        fetchAPI(endpoint, function (data, error) {
            var results = null;
            if (data && data.results) {
                results = (data.results || []).map(function (game) {
                    return {
                        id: game.id,
                        name: game.name,
                        background_image: game.background_image,
                        platforms: (game.platforms || []).map(function (p) { return p.platform.name; }),
                        released: game.released,
                        rating: game.rating,
                        metacritic: game.metacritic
                    };
                });
                setCached('search_' + query, results);
            }
            var callbacks = requestQueue[query] || [];
            delete requestQueue[query];
            callbacks.forEach(function (cb) { if (cb) cb(results, error); });
        });
    }

    function getGameDetails(gameId, callback) {
        var cached = getCached('details_' + gameId);
        if (cached) {
            if (callback) callback(cached, null);
            return;
        }

        fetchAPI('/games/' + gameId, function (data, error) {
            if (data) {
                var details = {
                    id: data.id,
                    name: data.name,
                    description: data.description_raw || data.description,
                    released: data.released,
                    rating: data.rating,
                    rating_top: data.rating_top,
                    metacritic: data.metacritic,
                    playtime: data.playtime,
                    genres: (data.genres || []).map(function (g) { return g.name; }),
                    platforms: (data.platforms || []).map(function (p) { return p.platform.name; }),
                    developers: (data.developers || []).map(function (d) { return d.name; }),
                    publishers: (data.publishers || []).map(function (p) { return p.name; }),
                    esrb_rating: data.esrb_rating ? data.esrb_rating.name : null,
                    stores: (data.stores || []).map(function (s) { return { name: s.store.name, url: s.url || '' }; }),
                    background_image: data.background_image,
                    screenshots_count: data.screenshots_count,
                    reddit_url: data.reddit_url,
                    twitch_count: data.twitch_count,
                    youtube_count: data.youtube_count
                };
                setCached('details_' + gameId, details);
                if (callback) callback(details, null);
            } else {
                if (callback) callback(null, error);
            }
        });
    }

    function getGameScreenshots(gameId, callback) {
        var cached = getCached('screenshots_' + gameId);
        if (cached) {
            if (callback) callback(cached, null);
            return;
        }

        fetchAPI('/games/' + gameId + '/screenshots?page_size=8', function (data, error) {
            if (data && data.results) {
                var results = (data.results || []).map(function (shot) {
                    return { image: shot.image, id: shot.id };
                });
                setCached('screenshots_' + gameId, results);
                if (callback) callback(results, null);
            } else {
                if (callback) callback(null, error);
            }
        });
    }

    function getSimilarGames(gameId, callback) {
        var cached = getCached('similar_' + gameId);
        if (cached) {
            if (callback) callback(cached, null);
            return;
        }

        fetchAPI('/games/' + gameId + '/suggested?page_size=6', function (data, error) {
            if (data && data.results) {
                var results = (data.results || []).map(function (game) {
                    return {
                        id: game.id,
                        name: game.name,
                        background_image: game.background_image,
                        rating: game.rating
                    };
                });
                setCached('similar_' + gameId, results);
                if (callback) callback(results, null);
            } else {
                if (callback) callback(null, error);
            }
        });
    }

    function getGameSeries(gameId, callback) {
        var cached = getCached('series_' + gameId);
        if (cached) {
            if (callback) callback(cached, null);
            return;
        }

        fetchAPI('/games/' + gameId + '/series?page_size=10', function (data, error) {
            if (data && data.results) {
                var results = (data.results || []).map(function (game) {
                    return { id: game.id, name: game.name, released: game.released };
                });
                setCached('series_' + gameId, results);
                if (callback) callback(results, null);
            } else {
                if (callback) callback(null, error);
            }
        });
    }

    window.rawgClient = {
        searchGames: searchGames,
        getGameDetails: getGameDetails,
        getGameScreenshots: getGameScreenshots,
        getSimilarGames: getSimilarGames,
        getGameSeries: getGameSeries,
        getCached: getCached
    };
})();
