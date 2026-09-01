// Data schema and normalizers
(function () {
  'use strict';

  var SCHEMA_VERSION = 2;

  function cleanString(value, fallback, max) {
    var s = String(value == null ? '' : value).trim();
    if (!s) s = fallback || '';
    return max ? s.slice(0, max) : s;
  }

  function cleanBool(value) { return value === true; }

  function normalizeTrophy(trophy) {
    trophy = trophy || {};
    return {
      id: cleanString(trophy.id, 'trophy-' + Math.random().toString(36).slice(2), 180),
      name: cleanString(trophy.name, 'Untitled trophy', 180),
      description: cleanString(trophy.description, '', 1000),
      tier: cleanString(trophy.tier, 'bronze', 20),
      unlocked: cleanBool(trophy.unlocked),
      unlockedAt: Number(trophy.unlockedAt || 0) || null,
      guide: cleanString(trophy.guide, '', 3000),
      sourceUrl: cleanString(trophy.sourceUrl, '', 2000)
    };
  }

  function normalizeGame(game) {
    game = game || {};
    var achievements = Array.isArray(game.achievements) ? game.achievements.map(normalizeTrophy) : [];
    return {
      id: cleanString(game.id, 'game-' + Date.now().toString(36), 180),
      title: cleanString(game.title, 'Untitled game', 180),
      platform: cleanString(game.platform, 'other', 40),
      cover: cleanString(game.cover, '', 3000),
      description: cleanString(game.description, '', 3000),
      status: cleanString(game.status, 'playing', 40),
      createdAt: Number(game.createdAt || Date.now()) || Date.now(),
      updatedAt: Number(game.updatedAt || Date.now()) || Date.now(),
      lastPlayed: Number(game.lastPlayed || 0) || null,
      playTime: Number(game.playTime || game.hours || 0) || 0,
      achievements: achievements,
      source: cleanString(game.source, '', 200),
      sourceUrl: cleanString(game.sourceUrl, '', 2000)
    };
  }

  function normalizeProfile(profile, fallbackName) {
    profile = profile || {};
    return {
      username: cleanString(profile.username, fallbackName || 'Hunter', 32),
      color: cleanString(profile.color, '#16a66f', 20),
      avatar: cleanString(profile.avatar, '', 4000) || null,
      bio: cleanString(profile.bio, '', 160),
      createdAt: Number(profile.createdAt || Date.now()) || Date.now(),
      setupComplete: profile.setupComplete !== false
    };
  }

  function normalizeSession(session) {
    session = session || {};
    return {
      id: cleanString(session.id, 'session-' + Date.now().toString(36), 120),
      gameId: cleanString(session.gameId, '', 180),
      gameTitle: cleanString(session.gameTitle, 'Play session', 180),
      minutes: Math.max(0, Math.min(1440, Number(session.minutes || 0) || 0)),
      note: cleanString(session.note, '', 300),
      startedAt: Number(session.startedAt || Date.now()) || Date.now()
    };
  }

  function normalizeFriend(friend) {
    friend = friend || {};
    return {
      id: cleanString(friend.id, 'friend-' + Date.now().toString(36), 120),
      name: cleanString(friend.name, 'Player', 80),
      status: cleanString(friend.status, 'Recently active', 120),
      avatar: cleanString(friend.avatar, '', 4000) || null
    };
  }

  function normalizeCabinet(cabinet, username) {
    cabinet = cabinet || {};
    var profile = normalizeProfile(cabinet.profile, username);
    profile.setupComplete = cabinet.profile && cabinet.profile.setupComplete !== false;
    return {
      schemaVersion: SCHEMA_VERSION,
      profile: profile,
      games: Array.isArray(cabinet.games) ? cabinet.games.map(normalizeGame) : [],
      sessions: Array.isArray(cabinet.sessions) ? cabinet.sessions.map(normalizeSession) : [],
      friends: Array.isArray(cabinet.friends) ? cabinet.friends.map(normalizeFriend) : [],
      showcase: cabinet.showcase === true
    };
  }

  window.PROGLOG_DATA_SCHEMA = {
    version: SCHEMA_VERSION,
    normalizeTrophy: normalizeTrophy,
    normalizeGame: normalizeGame,
    normalizeProfile: normalizeProfile,
    normalizeSession: normalizeSession,
    normalizeFriend: normalizeFriend,
    normalizeCabinet: normalizeCabinet
  };
})();
