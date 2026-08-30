// Firebase version of auth functions

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
    .then(function(result) {
      var user = result.user;
      // Send email verification
      user.sendEmailVerification().catch(function(e) {
        console.warn('Email verification could not be sent:', e);
      });
      // Update profile
      return user.updateProfile({
        displayName: email.split('@')[0],
        setupComplete: false
      }).then(function() {
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
    .then(function(result) {
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

  return avatarPromise.then(function(avatarUrl) {
    // Update user profile
    return user.updateProfile({
      displayName: profileData.username,
      photoURL: avatarUrl || user.photoURL,
      color: profileData.color,
      setupComplete: true
    }).then(function() {
      // Store in Firestore for additional data
      var db = window.proglogFirebase.db;
      return db.collection('users').doc(user.uid).set({
        username: profileData.username,
        color: profileData.color,
        avatar: avatarUrl || user.photoURL,
        setupComplete: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }).then(function() {
      // Refresh user to get updated metadata
      return user.reload();
    }).then(function() {
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
    .then(function(res) { return res.blob(); })
    .then(function(blob) {
      return ref.put(blob, { contentType: 'image/jpeg' });
    })
    .then(function(snapshot) {
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
    .then(function(result) {
      var user = result.user;
      // Check if this is a new user or existing
      var session = firebaseUserToSession(user);
      
      // Check Firestore for profile completion
      var db = window.proglogFirebase.db;
      return db.collection('users').doc(user.uid).get().then(function(doc) {
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
document.addEventListener('DOMContentLoaded', function() {
  var googleBtn = document.getElementById('btn-oauth-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', function() {
      signInWithProvider('google').then(function(session) {
        if (session.setupComplete) {
          window.location.href = 'app.html';
        } else {
          window.location.href = 'auth.html?mode=profile';
        }
      }).catch(function(err) {
        toast('Sign in failed: ' + err.message);
      });
    });
  }

  var githubBtn = document.getElementById('btn-oauth-github');
  if (githubBtn) {
    githubBtn.addEventListener('click', function() {
      signInWithProvider('github').then(function(session) {
        if (session.setupComplete) {
          window.location.href = 'app.html';
        } else {
          window.location.href = 'auth.html?mode=profile';
        }
      }).catch(function(err) {
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
registerAccount = function(email, password) {
  if (isFirebaseAvailable()) {
    // The actual auth is handled in auth-firebase.js
    return Promise.reject(new Error('Use auth-firebase.js for Firebase auth'));
  }
  return originalRegister(email, password);
};

authenticateUser = function(email, password) {
  if (isFirebaseAvailable()) {
    return Promise.reject(new Error('Use auth-firebase.js for Firebase auth'));
  }
  return originalAuthenticate(email, password);
};

completeProfileSetup = function(userId, profileData) {
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