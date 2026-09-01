// Firebase bootstrap. Safe when the Firebase SDK is unavailable or misconfigured.
(function () {
  'use strict';

  var config = window.PROGLOG_FIREBASE_CONFIG || {
    apiKey: 'AIzaSyDqj2EU0aDBaHTBAG6HLw_YqvMGBlak6oA',
    authDomain: 'proglog-fa459.firebaseapp.com',
    projectId: 'proglog-fa459',
    storageBucket: 'proglog-fa459.firebasestorage.app',
    messagingSenderId: '477703109132',
    appId: '1:477703109132:web:3252acf829a5a66fd18c29'
  };

  window.PROGLOG_FIREBASE_CONFIG = config;

  if (typeof firebase === 'undefined' || typeof firebase.initializeApp !== 'function') {
    window.proglogFirebase = { auth: null, db: null, storage: null, ready: false };
    window.PROGLOG_FIREBASE_READY = false;
    try { window.dispatchEvent(new CustomEvent('proglog:firebase-ready', { detail: { ready:false } })); } catch (e) {}
    return;
  }

  try {
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(config);

    var auth = firebase.auth();
    var db = firebase.firestore();
    var storage = firebase.storage();

    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {});
    try {
      db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });
      db.enablePersistence().catch(function () {});
    } catch (e) {}

    window.PROGLOG_FIREBASE = { auth: auth, db: db, storage: storage };
    window.proglogFirebase = { auth: auth, db: db, storage: storage, ready: true };
    window.PROGLOG_FIREBASE_READY = true;
    try { window.dispatchEvent(new CustomEvent('proglog:firebase-ready', { detail: { ready:true } })); } catch (e) {}
  } catch (error) {
    window.proglogFirebase = { auth: null, db: null, storage: null, ready: false };
    window.PROGLOG_FIREBASE_READY = false;
    try { window.dispatchEvent(new CustomEvent('proglog:firebase-ready', { detail: { ready:false } })); } catch (e) {}
  }
})();
