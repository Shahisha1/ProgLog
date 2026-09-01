(function () {
  'use strict';

  var state = { initialized: false, errorCount: 0 };

  function ensureToastRoot() {
    var root = document.getElementById('toast-wrap');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-wrap';
      root.className = 'toast-wrap';
      document.body.appendChild(root);
    }
    return root;
  }

  function toast(message, type) {
    var root = ensureToastRoot();
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = String(message || 'Something went wrong.');
    root.appendChild(el);
    window.setTimeout(function () {
      el.classList.add('is-leaving');
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 180);
    }, 3600);
  }

  function setButtonLoading(button, loading, loadingText) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.classList.add('is-loading');
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>' +
        escapeHtml(loadingText || 'Working…') + '</span>';
    } else {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.classList.remove('is-loading');
      if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function imageFallback(img) {
    if (!img || img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    var alt = img.getAttribute('alt') || 'Image';
    var wrapper = img.closest('.avatar, .avatar-wrap, .game-cover, .cover, .trophy-icon, .media-thumb') || img.parentElement;
    img.style.display = 'none';
    if (wrapper && !wrapper.querySelector('.media-fallback')) {
      var fallback = document.createElement('span');
      fallback.className = 'media-fallback';
      fallback.setAttribute('aria-label', alt + ' unavailable');
      fallback.textContent = '✦';
      wrapper.appendChild(fallback);
    }
  }

  function bindImages() {
    document.querySelectorAll('img').forEach(function (img) {
      img.setAttribute('loading', img.getAttribute('loading') || 'lazy');
      img.setAttribute('decoding', img.getAttribute('decoding') || 'async');
      img.addEventListener('error', function () { imageFallback(img); }, { once: true });
    });
  }

  function bindExternalLinks() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href) && a.hostname && a.hostname !== window.location.hostname) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });
  }

  function preventHorizontalOverflow() {
    document.documentElement.classList.add('proglog-safe-layout');
  }

  function friendlyError(error) {
    var code = error && error.code ? String(error.code) : '';
    var message = error && error.message ? String(error.message) : '';
    var map = {
      'auth/email-already-in-use': 'That email is already registered.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/weak-password': 'Use a stronger password (at least 6 characters).',
      'auth/wrong-password': 'The password is incorrect.',
      'auth/user-not-found': 'No account was found for that email.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
      'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
      'permission-denied': 'You do not have permission to do that.'
    };
    return map[code] || message || 'Something went wrong. Please try again.';
  }

  function handleError(error, fallback) {
    state.errorCount += 1;
    console.error('[Proglog]', error);
    toast(friendlyError(error) || fallback || 'Something went wrong. Please try again.', 'error');
  }

  function installGlobalErrorHandlers() {
    window.addEventListener('error', function (event) {
      if (!event || !event.error) return;
      handleError(event.error, 'Something went wrong while loading this page.');
    });
    window.addEventListener('unhandledrejection', function (event) {
      var reason = event && event.reason;
      if (reason) handleError(reason, 'A request could not be completed.');
    });
  }

  function installNavigationFallback() {
    document.addEventListener('click', function (event) {
      var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
      if (!link || link.target === '_blank' || event.defaultPrevented) return;
      var href = link.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      link.classList.add('is-navigating');
    });
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;
    installGlobalErrorHandlers();
    preventHorizontalOverflow();
    bindImages();
    bindExternalLinks();
    installNavigationFallback();
    document.documentElement.classList.add('proglog-ready');
  }

  window.proglogApp = {
    toast: toast,
    setButtonLoading: setButtonLoading,
    escapeHtml: escapeHtml,
    imageFallback: imageFallback,
    friendlyError: friendlyError,
    handleError: handleError
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
