// Proglog Firebase Client
(function () {
  'use strict';

  var auth = null;
  var db = null;
  var storage = null;

  function init() {
    try {
      if (typeof firebase !== 'undefined' && firebase.app) {
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        console.log('Firebase initialized successfully');
      } else {
        console.warn('Firebase SDK not loaded');
      }
    } catch (e) {
      console.warn('Firebase initialization failed:', e);
    }
  }

  init();

  window.proglogFirebase = {
    auth: auth,
    db: db,
    storage: storage
  };
  window.proglogFirebaseReady = !!(auth && db && storage);
})();