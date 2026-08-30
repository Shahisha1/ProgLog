// Proglog Firebase Client
(function() {
  'use strict';

  var ready = false;
  var auth = null;
  var db = null;
  var storage = null;

  function init() {
    try {
      auth = firebase.auth();
      db = firebase.firestore();
      storage = firebase.storage();
      ready = true;
    } catch (e) {
      console.warn('Firebase initialization failed:', e);
    }
  }

  if (typeof firebase !== 'undefined' && firebase.app) {
    init();
  } else {
    console.warn('Firebase SDK not loaded');
  }

  window.proglogFirebaseReady = ready;
  window.proglogFirebase = {
    auth: auth,
    db: db,
    storage: storage
  };
})();