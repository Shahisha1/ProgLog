(function () {
  'use strict';

  var timers = {};
  var writes = {};
  var currentUser = null;
  var USER_COLLECTION = 'users';
  var SCHEMA_VERSION = (window.PROGLOG_DATA_SCHEMA && window.PROGLOG_DATA_SCHEMA.version) || 2;

  function firebaseReady() {
    return !!(window.proglogFirebase && window.proglogFirebase.auth && window.proglogFirebase.db);
  }

  function signedInUser() {
    return firebaseReady() ? window.proglogFirebase.auth.currentUser : null;
  }

  function schema() {
    return window.PROGLOG_DATA_SCHEMA || {};
  }

  function localGet(username) {
    try {
      var raw = localStorage.getItem('cabinet_data_' + username);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function localSet(username, cabinet) {
    try { localStorage.setItem('cabinet_data_' + username, JSON.stringify(cabinet)); } catch (e) { }
  }

  function localProfiles() {
    try { return JSON.parse(localStorage.getItem('cabinet_profiles') || '[]'); } catch (e) { return []; }
  }

  function localSetProfiles(items) {
    try { localStorage.setItem('cabinet_profiles', JSON.stringify(items)); } catch (e) { }
  }

  function syncLocalProfile(cabinet) {
    if (!cabinet || !cabinet.profile || !cabinet.profile.username) return;
    var profiles = localProfiles();
    var normalized = cabinet.profile;
    var found = false;
    profiles = profiles.map(function (p) {
      if (p.username === normalized.username) { found = true; return normalized; }
      return p;
    });
    if (!found) profiles.push(normalized);
    localSetProfiles(profiles);
  }

  function userRef(uid) {
    return window.proglogFirebase.db.collection(USER_COLLECTION).doc(uid);
  }

  function safeDocId(value) {
    return String(value == null ? '' : value).replace(/[\/#?\[\]]/g, '_').slice(0, 480) || 'item';
  }

  function gameRef(uid, gameId) {
    return userRef(uid).collection('games').doc(safeDocId(gameId));
  }

  function sessionRef(uid, sessionId) {
    return userRef(uid).collection('sessions').doc(safeDocId(sessionId));
  }

  function friendRef(uid, friendId) {
    return userRef(uid).collection('friends').doc(safeDocId(friendId));
  }

  function chunks(items, size) {
    var result = [];
    for (var i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
    return result;
  }

  function upsertBatch(uid, games, sessions, friends) {
    var operations = [];
    games.forEach(function (g) { operations.push({ ref: gameRef(uid, g.id), data: g }); });
    sessions.forEach(function (s) { operations.push({ ref: sessionRef(uid, s.id), data: s }); });
    friends.forEach(function (f) { operations.push({ ref: friendRef(uid, f.id), data: f }); });

    return chunks(operations, 450).reduce(function (promise, group) {
      return promise.then(function () {
        if (!group.length) return null;
        var batch = window.proglogFirebase.db.batch();
        group.forEach(function (op) {
          batch.set(op.ref, Object.assign({}, op.data, {
            schemaVersion: SCHEMA_VERSION,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }), { merge: true });
        });
        return batch.commit();
      });
    }, Promise.resolve());
  }

  function pushCabinet(user, cabinet, options) {
    if (!firebaseReady() || !user || !cabinet || cabinet.showcase) return Promise.resolve(false);
    options = options || {};
    var normalize = schema().normalizeCabinet;
    var normalized = normalize ? normalize(cabinet, user.displayName || (user.email || '').split('@')[0]) : cabinet;
    var profile = normalized.profile || {};
    var uid = user.uid;
    var ref = userRef(uid);

    var userDoc = {
      schemaVersion: SCHEMA_VERSION,
      username: profile.username || user.displayName || 'Hunter',
      color: profile.color || '#16a66f',
      avatar: profile.avatar || user.photoURL || null,
      bio: profile.bio || '',
      setupComplete: profile.setupComplete !== false,
      gameIds: normalized.games.map(function (g) { return String(g.id); }),
      sessionIds: normalized.sessions.map(function (s) { return String(s.id); }),
      friendIds: normalized.friends.map(function (f) { return String(f.id); }),
      preferences: {
        soundEnabled: localStorage.getItem('proglog_pref_sound') !== 'false'
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    return ref.set(userDoc, { merge: true })
      .then(function () { return upsertBatch(uid, normalized.games, normalized.sessions, normalized.friends); })
      .then(function () {
        currentUser = user;
        return true;
      })
      .catch(function (error) {
        console.warn('[Proglog cloud] write failed:', error);
        if (window.proglogApp) window.proglogApp.toast('Saved locally. Cloud sync is temporarily unavailable.', 'info');
        return false;
      });
  }

  function restoreUser(user) {
    if (!firebaseReady() || !user) return Promise.resolve(null);
    currentUser = user;
    var existingLocal = localGet(user.displayName || (user.email || '').split('@')[0]);
    var ref = userRef(user.uid);

    return ref.get().then(function (doc) {
      if (!doc.exists) {
        var initial = existingLocal && existingLocal.showcase !== true ? existingLocal : {
          profile: {
            username: user.displayName || (user.email || '').split('@')[0] || 'Hunter',
            color: '#16a66f',
            avatar: user.photoURL || null,
            setupComplete: false,
            createdAt: Date.now()
          },
          games: [],
          sessions: [],
          friends: []
        };
        var normalized = schema().normalizeCabinet ? schema().normalizeCabinet(initial, initial.profile.username) : initial;
        return pushCabinet(user, normalized, { initial: true }).then(function () {
          localSet(normalized.profile.username, normalized);
          syncLocalProfile(normalized);
          return normalized;
        });
      }

      var meta = doc.data() || {};
      // A previous Proglog build stored only the profile. Migrate its local
      // cabinet once instead of replacing it with an empty cloud cabinet.
      if ((!meta.schemaVersion || !Array.isArray(meta.gameIds)) && existingLocal && existingLocal.showcase !== true) {
        var migrated = schema().normalizeCabinet ? schema().normalizeCabinet(existingLocal, existingLocal.profile && existingLocal.profile.username) : existingLocal;
        return pushCabinet(user, migrated, { migration: true }).then(function () {
          localSet(migrated.profile.username, migrated);
          syncLocalProfile(migrated);
          return migrated;
        });
      }
      var username = meta.username || user.displayName || (user.email || '').split('@')[0] || 'Hunter';
      var base = {
        schemaVersion: meta.schemaVersion || SCHEMA_VERSION,
        profile: {
          username: username,
          color: meta.color || '#16a66f',
          avatar: meta.avatar || user.photoURL || null,
          bio: meta.bio || '',
          createdAt: meta.createdAt && meta.createdAt.toMillis ? meta.createdAt.toMillis() : (meta.createdAt || Date.now()),
          setupComplete: meta.setupComplete !== false
        },
        games: [],
        sessions: [],
        friends: []
      };

      var gameIds = Array.isArray(meta.gameIds) ? meta.gameIds : [];
      var sessionIds = Array.isArray(meta.sessionIds) ? meta.sessionIds : [];
      var friendIds = Array.isArray(meta.friendIds) ? meta.friendIds : [];

      return Promise.all([
        gameIds.length ? Promise.all(gameIds.map(function (id) { return gameRef(user.uid, id).get(); })) : Promise.resolve([]),
        sessionIds.length ? Promise.all(sessionIds.map(function (id) { return sessionRef(user.uid, id).get(); })) : Promise.resolve([]),
        friendIds.length ? Promise.all(friendIds.map(function (id) { return friendRef(user.uid, id).get(); })) : Promise.resolve([])
      ]).then(function (result) {
        base.games = result[0].filter(function (d) { return d.exists; }).map(function (d) { return d.data(); });
        base.sessions = result[1].filter(function (d) { return d.exists; }).map(function (d) { return d.data(); });
        base.friends = result[2].filter(function (d) { return d.exists; }).map(function (d) { return d.data(); });
        var normalized = schema().normalizeCabinet ? schema().normalizeCabinet(base, username) : base;
        localSet(username, normalized);
        syncLocalProfile(normalized);
        if (meta.preferences && typeof meta.preferences.soundEnabled === 'boolean') {
          try {
            localStorage.setItem('proglog_pref_sound', meta.preferences.soundEnabled ? 'true' : 'false');
            localStorage.setItem('proglog_sound', meta.preferences.soundEnabled ? 'true' : 'false');
          } catch (e) { }
        }
        return normalized;
      });
    }).catch(function (error) {
      console.warn('[Proglog cloud] restore failed:', error);
      return existingLocal || null;
    });
  }

  function queueCabinetSync(cabinet) {
    var user = signedInUser();
    if (!user || !cabinet || cabinet.showcase) return;
    clearTimeout(timers[user.uid]);
    writes[user.uid] = Promise.resolve(writes[user.uid]).catch(function () { }).then(function () {
      return new Promise(function (resolve) {
        timers[user.uid] = setTimeout(function () {
          pushCabinet(user, cabinet).then(resolve);
        }, 300);
      });
    });
  }

  function savePreferences(prefs) {
    var user = signedInUser();
    if (!user) return Promise.resolve(false);
    return userRef(user.uid).set({ preferences: prefs, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true })
      .then(function () { return true; })
      .catch(function () { return false; });
  }

  function isCloudUser() { return !!signedInUser(); }

  window.proglogCloud = {
    ready: firebaseReady,
    restoreUser: restoreUser,
    pushCabinet: pushCabinet,
    queueCabinetSync: queueCabinetSync,
    savePreferences: savePreferences,
    isCloudUser: isCloudUser,
    currentUser: signedInUser
  };
})();
