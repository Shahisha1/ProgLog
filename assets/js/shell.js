/* Proglog application shell interactions. Keeps navigation predictable and lightweight. */
(function () {
  'use strict';

  function goProfile() {
    if (typeof window.pgGo === 'function') window.pgGo('profile');
    else window.location.href = '../../pages/profile/profile.html';
  }

  function initUserLinks() {
    document.querySelectorAll('.global-sidebar-user, .sidebar-user').forEach(function (el) {
      if (el.dataset.profileLinkReady === '1') return;
      el.dataset.profileLinkReady = '1';
      el.setAttribute('role', 'link');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'Open your profile');
      el.addEventListener('click', function (event) {
        if (event.target.closest('button, a, input, select, textarea')) return;
        goProfile();
      });
      el.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goProfile();
        }
      });
    });
  }

  function initNavigation() {
    var current = (document.body && document.body.dataset && document.body.dataset.page) || '';
    if (current) {
      document.querySelectorAll('[data-nav]').forEach(function (link) {
        link.classList.toggle('active', link.dataset.nav === current);
      });
    }
  }

  function init() {
    initUserLinks();
    initNavigation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
