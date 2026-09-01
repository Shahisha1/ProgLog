(function () {
  'use strict';
  var booted = false;
  function markReady() { if (booted) return; booted = true; document.documentElement.classList.add('proglog-app-ready'); }
  window.addEventListener('proglog:ready', markReady);
  window.addEventListener('proglog:firebase-ready', function () { document.documentElement.classList.add('proglog-firebase-checked'); });
  document.addEventListener('DOMContentLoaded', function () {
    window.setTimeout(function () {
      if (booted) return;
      // Don't block the application if an optional script or remote service is slow.
      document.documentElement.classList.add('proglog-app-ready');
    }, 1200);
  });
})();
