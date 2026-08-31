// Firebase version of auth functions
// Proglog data + authentication store.
// Production auth is handled by Firebase. Local storage remains for the game
// vault because the current prototype's game model is intentionally client-side.

var storageWorks = true;

// ==================== STORAGE FUNCTIONS ====================

// Make these functions globally available
window.cacheSession = cacheSession;
window.syncCabinetProfile = syncCabinetProfile;
window.getCurrentSession = getCurrentSession;
window.refreshCurrentSession = refreshCurrentSession;
window.logoutSession = logoutSession;
window.getProfiles = getProfiles;
window.setProfiles = setProfiles;
window.getCabinetData = getCabinetData;
window.setCabinetData = setCabinetData;
window.getLastUser = getLastUser;
window.setLastUser = setLastUser;
window.registerAccount = registerAccount;
window.authenticateUser = authenticateUser;
window.completeProfileSetup = completeProfileSetup;

function supabaseReady() { return false; }

function authReady() {
  if (window.proglogFirebase && window.proglogFirebase.auth) {
    var user = window.proglogFirebase.auth.currentUser;
    if (user) {
      return Promise.resolve({ data: { session: { user: user } }, error: null });
    }
    return Promise.resolve({ data: { session: null }, error: null });
  }
  return Promise.resolve({ data: { session: null }, error: null });
}

// ==================== AUTH FUNCTIONS ====================

function cacheSession(session) {
  if (!storageWorks) return;
  if (session) {
    try {
      localStorage.setItem('proglog_session', JSON.stringify(session));
      if (session.username) localStorage.setItem('cabinet_last_user', session.username);
    } catch (e) {
      console.warn('Could not cache session:', e);
    }
  } else {
    try {
      localStorage.removeItem('proglog_session');
      localStorage.removeItem('cabinet_last_user');
    } catch (e) {
      console.warn('Could not clear session:', e);
    }
  }
}

function getCurrentSession() {
  if (!storageWorks) return null;
  try {
    var raw = localStorage.getItem('proglog_session');
    if (!raw) return null;
    var s = JSON.parse(raw);
    // Check if session is expired (only for local sessions)
    if (s.expiresAt && s.expiresAt < Date.now() && !window.proglogFirebase) {
      logoutSession();
      return null;
    }
    return s;
  } catch (e) {
    return null;
  }
}

function refreshCurrentSession() {
  // Check Firebase first
  if (window.proglogFirebase && window.proglogFirebase.auth) {
    var user = window.proglogFirebase.auth.currentUser;
    if (user) {
      // Check Firestore for profile data
      var db = window.proglogFirebase.db;
      return db.collection('users').doc(user.uid).get()
        .then(function (doc) {
          var data = doc.data() || {};
          var session = {
            userId: user.uid,
            email: user.email,
            username: data.username || user.displayName || user.email.split('@')[0],
            color: data.color || '#16a66f',
            avatar: data.avatar || user.photoURL || null,
            setupComplete: data.setupComplete || false,
            token: user.refreshToken,
            expiresAt: null
          };
          cacheSession(session);
          return session;
        })
        .catch(function () {
          // Fallback to basic user info
          var session = {
            userId: user.uid,
            email: user.email,
            username: user.displayName || user.email.split('@')[0],
            color: '#16a66f',
            avatar: user.photoURL || null,
            setupComplete: false,
            token: user.refreshToken,
            expiresAt: null
          };
          cacheSession(session);
          return session;
        });
    }
    return Promise.resolve(null);
  }

  // Fallback to local storage
  var session = getCurrentSession();
  return Promise.resolve(session);
}

function logoutSession() {
  cacheSession(null);
  if (window.proglogFirebase && window.proglogFirebase.auth) {
    return window.proglogFirebase.auth.signOut()
      .catch(function (err) {
        console.warn('Sign out error:', err);
      });
  }
  return Promise.resolve();
}

// ==================== PROFILE FUNCTIONS ====================

function syncCabinetProfile(session) {
  if (!session || !session.username) return;
  try {
    var cab = getCabinetData(session.username);
    if (!cab) cab = { profile: {}, games: [] };
    cab.profile = {
      username: session.username,
      color: session.color || '#16a66f',
      avatar: session.avatar || null,
      createdAt: cab.profile && cab.profile.createdAt ? cab.profile.createdAt : Date.now()
    };
    setCabinetData(session.username, cab);
    var profs = getProfiles();
    var found = false;
    profs = profs.map(function (p) {
      if (p.username === session.username) { found = true; return cab.profile; }
      return p;
    });
    if (!found) profs.push(cab.profile);
    setProfiles(profs);
  } catch (e) {
    console.warn('Could not sync cabinet profile:', e);
  }
}

// ==================== LOCAL STORAGE HELPERS ====================

function getProfiles() {
  if (!storageWorks) return [];
  try { return JSON.parse(localStorage.getItem('cabinet_profiles') || '[]'); } catch (e) { return []; }
}

function setProfiles(list) {
  if (storageWorks) {
    try { localStorage.setItem('cabinet_profiles', JSON.stringify(list)); } catch (e) { }
  }
}

function getCabinetData(username) {
  if (!storageWorks || !username) return null;
  try {
    var raw = localStorage.getItem('cabinet_data_' + username);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function setCabinetData(username, data) {
  if (storageWorks && username) {
    try { localStorage.setItem('cabinet_data_' + username, JSON.stringify(data)); } catch (e) { }
  }
}

function getLastUser() {
  var s = getCurrentSession();
  if (s && s.username) return s.username;
  if (storageWorks) {
    try { return localStorage.getItem('cabinet_last_user'); } catch (e) { return null; }
  }
  return null;
}

function setLastUser(username) {
  if (!storageWorks) return;
  try {
    if (username) localStorage.setItem('cabinet_last_user', username);
    else localStorage.removeItem('cabinet_last_user');
  } catch (e) { }
}

// ==================== LOCAL AUTH FALLBACK ====================

function registerAccount(email, password) {
  // Check if Firebase is available
  if (window.proglogFirebase && window.proglogFirebase.auth) {
    return Promise.reject(new Error('Use Firebase auth instead'));
  }

  // Local fallback
  var existing = findUserByEmail(email);
  if (existing) return Promise.reject(new Error('An account with this email already exists.'));
  return hashPassword(password).then(function (hash) {
    var users = getUsers();
    var newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      provider: 'local',
      createdAt: Date.now(),
      profile: { username: email.split('@')[0], color: '#16a66f', avatar: null, setupComplete: false }
    };
    users.push(newUser);
    saveUsers(users);
    return createSession(newUser);
  });
}

function authenticateUser(email, password) {
  if (window.proglogFirebase && window.proglogFirebase.auth) {
    return Promise.reject(new Error('Use Firebase auth instead'));
  }

  var user = findUserByEmail(email);
  if (!user) return Promise.reject(new Error('No account found with this email address.'));
  return hashPassword(password).then(function (hash) {
    if (user.passwordHash !== hash) throw new Error('Incorrect password. Please try again.');
    return createSession(user);
  });
}

function completeProfileSetup(userId, profileData) {
  if (window.proglogFirebase && window.proglogFirebase.auth) {
    return Promise.reject(new Error('Use Firebase auth instead'));
  }

  var users = getUsers();
  var target = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id === userId) {
      target = users[i];
      target.profile.username = profileData.username || target.profile.username;
      target.profile.color = profileData.color || target.profile.color;
      target.profile.avatar = profileData.avatar !== undefined ? profileData.avatar : target.profile.avatar;
      target.profile.setupComplete = true;
      break;
    }
  }
  if (!target) return null;
  saveUsers(users);
  var session = createSession(target);
  syncCabinetProfile(session);
  return session;
}

// ==================== LOCAL STORAGE HELPERS ====================

function getUsers() {
  if (!storageWorks) return [];
  try { return JSON.parse(localStorage.getItem('proglog_users') || '[]'); } catch (e) { return []; }
}

function saveUsers(users) {
  if (storageWorks) {
    try { localStorage.setItem('proglog_users', JSON.stringify(users)); } catch (e) { }
  }
}

function findUserByEmail(email) {
  var list = getUsers();
  var em = String(email || '').trim().toLowerCase();
  for (var i = 0; i < list.length; i++) {
    if (list[i].email && list[i].email.toLowerCase() === em) return list[i];
  }
  return null;
}

function hashPassword(password) {
  var salt = 'proglog_dev_salt_2026_';
  if (window.crypto && crypto.subtle) {
    var buffer = new TextEncoder().encode(salt + password);
    return crypto.subtle.digest('SHA-256', buffer).then(function (hashBuffer) {
      return Array.from(new Uint8Array(hashBuffer)).map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    }).catch(function () { return fallbackHash(salt + password); });
  }
  return Promise.resolve(fallbackHash(salt + password));
}

function fallbackHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16);
}

function createSession(user) {
  var session = user && user.userId ? user : {
    userId: user.id,
    email: user.email,
    username: user.profile.username,
    color: user.profile.color,
    avatar: user.profile.avatar,
    setupComplete: user.profile.setupComplete,
    token: 'legacy_' + Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    provider: user.provider || 'local'
  };
  cacheSession(session);
  return session;
}

// ==================== MIGRATION ====================

function migrateLegacyStorage() {
  if (!storageWorks) return;
  var pairs = [
    ['proglog_users', 'platvault_users'],
    ['proglog_session', 'platvault_session'],
    ['proglog_sound', 'platvault_sound']
  ];
  pairs.forEach(function (pair) {
    try {
      var current = localStorage.getItem(pair[0]);
      var legacy = localStorage.getItem(pair[1]);
      if (!current && legacy) localStorage.setItem(pair[0], legacy);
    } catch (e) { }
  });
}

// Check storage
try {
  var _test = '__proglog_probe__';
  localStorage.setItem(_test, '1');
  localStorage.removeItem(_test);
} catch (e) {
  storageWorks = false;
}
migrateLegacyStorage();

// ==================== EXPOSE GLOBALLY ====================

window.storageWorks = storageWorks;
window.authReady = authReady;

console.log('Proglog store initialized. Firebase available:', !!(window.proglogFirebase && window.proglogFirebase.auth));


function supabaseReady() { return false; }

function authReady() {
  if (window.proglogFirebase && window.proglogFirebase.auth) {
    return window.proglogFirebase.auth.currentUser
      ? Promise.resolve({ data: { session: { user: window.proglogFirebase.auth.currentUser } }, error: null })
      : Promise.resolve({ data: { session: null }, error: null });
  }
  return Promise.resolve({ data: { session: null }, error: null });
}

function firebaseUserToSession(user) {
  if (!user) return null;
  return {
    userId: user.uid,
    email: user.email,
    username: user.displayName || user.email.split('@')[0],
    color: user.color || '#16a66f',
    avatar: user.photoURL || null,
    setupComplete: !!user.setupComplete,
    token: user.refreshToken,
    expiresAt: null,
    provider: user.providerData && user.providerData[0] ? user.providerData[0].providerId : 'email'
  };
}

function registerAccount(email, password) {
  if (!window.proglogFirebase || !window.proglogFirebase.auth) {
    // Local fallback
    return localRegister(email, password);
  }

  return window.proglogFirebase.auth.createUserWithEmailAndPassword(email, password)
    .then(function (result) {
      var user = result.user;
      // Send email verification
      user.sendEmailVerification().catch(function (e) {
        console.warn('Email verification could not be sent:', e);
      });
      // Update profile
      return user.updateProfile({
        displayName: email.split('@')[0],
        setupComplete: false
      }).then(function () {
        return {
          userId: user.uid,
          email: user.email,
          username: email.split('@')[0],
          color: '#16a66f',
          avatar: null,
          setupComplete: false,
          needsEmailConfirmation: true
        };
      });
    });
}

function authenticateUser(email, password) {
  if (!window.proglogFirebase || !window.proglogFirebase.auth) {
    return localAuthenticate(email, password);
  }

  return window.proglogFirebase.auth.signInWithEmailAndPassword(email, password)
    .then(function (result) {
      var user = result.user;
      if (!user.emailVerified) {
        throw new Error('Please verify your email before logging in. Check your inbox.');
      }
      return firebaseUserToSession(user);
    });
}

function completeProfileSetup(userId, profileData) {
  if (!window.proglogFirebase || !window.proglogFirebase.auth) {
    return localCompleteProfile(userId, profileData);
  }

  var user = window.proglogFirebase.auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found.');
  }

  // Upload avatar to Firebase Storage if provided
  var avatarPromise = Promise.resolve(null);
  if (profileData.avatar && profileData.avatar.startsWith('data:image')) {
    avatarPromise = uploadAvatar(user.uid, profileData.avatar);
  }

  return avatarPromise.then(function (avatarUrl) {
    // Update user profile
    return user.updateProfile({
      displayName: profileData.username,
      photoURL: avatarUrl || user.photoURL,
      color: profileData.color,
      setupComplete: true
    }).then(function () {
      // Store in Firestore for additional data
      var db = window.proglogFirebase.db;
      return db.collection('users').doc(user.uid).set({
        username: profileData.username,
        color: profileData.color,
        avatar: avatarUrl || user.photoURL,
        setupComplete: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }).then(function () {
      // Refresh user to get updated metadata
      return user.reload();
    }).then(function () {
      var updatedUser = window.proglogFirebase.auth.currentUser;
      var session = firebaseUserToSession(updatedUser);
      session.setupComplete = true;
      cacheSession(session);
      syncCabinetProfile(session);
      return session;
    });
  });
}

function uploadAvatar(uid, dataUrl) {
  var storage = window.proglogFirebase.storage;
  var ref = storage.ref('avatars/' + uid + '.jpg');

  // Convert data URL to blob
  return fetch(dataUrl)
    .then(function (res) { return res.blob(); })
    .then(function (blob) {
      return ref.put(blob, { contentType: 'image/jpeg' });
    })
    .then(function (snapshot) {
      return snapshot.ref.getDownloadURL();
    });
}

function signInWithProvider(provider) {
  if (!window.proglogFirebase || !window.proglogFirebase.auth) {
    return Promise.reject(new Error('Firebase not configured'));
  }

  var authProvider;
  if (provider === 'google') {
    authProvider = new firebase.auth.GoogleAuthProvider();
  } else if (provider === 'github') {
    authProvider = new firebase.auth.GithubAuthProvider();
  } else {
    return Promise.reject(new Error('Unsupported provider'));
  }

  return window.proglogFirebase.auth.signInWithPopup(authProvider)
    .then(function (result) {
      var user = result.user;
      // Check if this is a new user or existing
      var session = firebaseUserToSession(user);

      // Check Firestore for profile completion
      var db = window.proglogFirebase.db;
      return db.collection('users').doc(user.uid).get().then(function (doc) {
        if (doc.exists) {
          var data = doc.data();
          session.setupComplete = data.setupComplete || false;
          session.color = data.color || '#16a66f';
          session.username = data.username || user.displayName || user.email.split('@')[0];
          session.avatar = data.avatar || user.photoURL;
        } else {
          // New user - create profile
          session.setupComplete = false;
          session.username = user.displayName || user.email.split('@')[0];
          session.color = '#16a66f';
          session.avatar = user.photoURL;
        }
        cacheSession(session);
        syncCabinetProfile(session);
        return session;
      });
    });
}

// OAuth button handlers
document.addEventListener('DOMContentLoaded', function () {
  var googleBtn = document.getElementById('btn-oauth-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', function () {
      signInWithProvider('google').then(function (session) {
        if (session.setupComplete) {
          window.pgGo('overview');
        } else {
          window.pgGo('auth','?mode=profile');
        }
      }).catch(function (err) {
        toast('Sign in failed: ' + err.message);
      });
    });
  }

  var githubBtn = document.getElementById('btn-oauth-github');
  if (githubBtn) {
    githubBtn.addEventListener('click', function () {
      signInWithProvider('github').then(function (session) {
        if (session.setupComplete) {
          window.pgGo('overview');
        } else {
          window.pgGo('auth','?mode=profile');
        }
      }).catch(function (err) {
        toast('Sign in failed: ' + err.message);
      });
    });
  }
});

// Helper to check if Firebase is available
function isFirebaseAvailable() {
  return !!(window.proglogFirebase && window.proglogFirebase.auth);
}

// Override auth functions to use Firebase when available
var originalRegister = registerAccount;
var originalAuthenticate = authenticateUser;
var originalCompleteProfile = completeProfileSetup;

// Keep local fallbacks but prefer Firebase
registerAccount = function (email, password) {
  if (isFirebaseAvailable()) {
    // The actual auth is handled in auth-firebase.js
    return Promise.reject(new Error('Use auth-firebase.js for Firebase auth'));
  }
  return originalRegister(email, password);
};

authenticateUser = function (email, password) {
  if (isFirebaseAvailable()) {
    return Promise.reject(new Error('Use auth-firebase.js for Firebase auth'));
  }
  return originalAuthenticate(email, password);
};

completeProfileSetup = function (userId, profileData) {
  if (isFirebaseAvailable()) {
    return Promise.reject(new Error('Use auth-firebase.js for Firebase auth'));
  }
  return originalCompleteProfile(userId, profileData);
};

// Update HTML files to use Firebase CDN
// Replace Supabase script with:
// <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-storage-compat.js"></script>