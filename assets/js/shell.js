/* Proglog application shell interactions. Keeps navigation predictable and lightweight. */
(function () {
  'use strict';

  function goProfile() {
    if (typeof window.pgGo === 'function') { window.pgGo('profile'); return; }
    var path = window.location.pathname || '';
    var prefix = path.indexOf('/pages/') >= 0 ? path.slice(0, path.indexOf('/pages/')) : path.replace(/\/[^\/]*$/, '');
    window.location.href = (prefix || '') + '/pages/user/profile.html';
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

  function hydrateSidebarUser() {
    var session = null;
    try {
      session = typeof window.getCurrentSession === 'function' ? window.getCurrentSession() : null;
    } catch (e) { }
    var name = (session && (session.username || session.email)) || 'Hunter';
    var avatar = session && session.avatar;
    var nameEls = document.querySelectorAll('#global-sidebar-name, #profile-sidebar-name');
    nameEls.forEach(function (el) { el.textContent = name; });
    var avatarEls = document.querySelectorAll('#global-sidebar-avatar, #profile-sidebar-avatar');
    avatarEls.forEach(function (el) {
      el.textContent = '';
      el.style.backgroundImage = '';
      if (avatar) {
        var img = document.createElement('img');
        img.src = String(avatar);
        img.alt = '';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', function () { if (window.proglogApp) window.proglogApp.imageFallback(img); }, { once: true });
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        el.appendChild(img);
      } else {
        el.textContent = name.slice(0, 1).toUpperCase();
      }
    });
  }

  function updateCloudStatus() {
    var badge = document.querySelector('[data-cloud-status]');
    if (!badge) return;
    var user = window.proglogFirebase && window.proglogFirebase.auth ? window.proglogFirebase.auth.currentUser : null;
    badge.textContent = user ? 'Cloud sync on' : 'Offline demo';
    badge.classList.toggle('is-offline', !user);
  }

  function initSignOut() {
    var btn = document.getElementById('btn-switch-profile');
    if (!btn || btn.dataset.signOutReady === '1') return;
    btn.dataset.signOutReady = '1';
    btn.addEventListener('click', function () {
      try {
        if (typeof window.setLastUser === 'function') window.setLastUser(null);
        if (typeof window.logoutSession === 'function') window.logoutSession();
      } catch (e) { }
      if (typeof window.pgGo === 'function') {
        window.pgGo('auth');
      } else {
        window.location.href = '../../pages/core/auth.html';
      }
    });
  }

  function init() {
    initUserLinks();
    initNavigation();
    hydrateSidebarUser();
    initSignOut();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
