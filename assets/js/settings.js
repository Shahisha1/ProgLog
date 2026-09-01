(function () {
  'use strict';

  function read(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { }
  }

  function saveCloudPrefs() {
    if (window.proglogCloud && window.proglogCloud.savePreferences) {
      window.proglogCloud.savePreferences({
        soundEnabled: !!read('proglog_pref_sound', true),
        compact: !!read('proglog_pref_compact', false),
        reducedMotion: !!read('proglog_pref_reduced_motion', false),
        highContrast: !!read('proglog_pref_high_contrast', false),
        showHelpfulTips: !!read('proglog_pref_helpful_tips', true),
        sessionRecap: !!read('proglog_pref_session_recap', true)
      }).catch(function () { });
    }
  }

  function applyToggleState(name, value, className, onReady) {
    if (className) document.body.classList.toggle(className, !!value);
    if (onReady) onReady(!!value);
  }

  var sound = document.getElementById('pref-sounds') || document.getElementById('pref-sound-toggle');
  var compact = document.getElementById('pref-compact');
  var reducedMotion = document.getElementById('pref-reduced-motion');
  var highContrast = document.getElementById('pref-high-contrast');
  var helpfulTips = document.getElementById('pref-helpful-tips');
  var sessionRecap = document.getElementById('pref-session-recap');

  if (sound) {
    sound.checked = read('proglog_pref_sound', true);
    sound.addEventListener('change', function () {
      write('proglog_pref_sound', sound.checked);
      saveCloudPrefs();
      if (window.toast) window.toast(sound.checked ? 'Trophy sounds enabled.' : 'Trophy sounds disabled.');
    });
  }

  if (compact) {
    compact.checked = read('proglog_pref_compact', false);
    compact.addEventListener('change', function () {
      write('proglog_pref_compact', compact.checked);
      saveCloudPrefs();
      document.body.classList.toggle('compact-trophies', compact.checked);
    });
    applyToggleState('proglog_pref_compact', compact.checked, 'compact-trophies');
  }

  if (reducedMotion) {
    reducedMotion.checked = read('proglog_pref_reduced_motion', false);
    reducedMotion.addEventListener('change', function () {
      write('proglog_pref_reduced_motion', reducedMotion.checked);
      saveCloudPrefs();
      document.body.classList.toggle('reduced-motion', reducedMotion.checked);
    });
    applyToggleState('proglog_pref_reduced_motion', reducedMotion.checked, 'reduced-motion');
  }

  if (highContrast) {
    highContrast.checked = read('proglog_pref_high_contrast', false);
    highContrast.addEventListener('change', function () {
      write('proglog_pref_high_contrast', highContrast.checked);
      saveCloudPrefs();
      document.body.classList.toggle('high-contrast', highContrast.checked);
    });
    applyToggleState('proglog_pref_high_contrast', highContrast.checked, 'high-contrast');
  }

  if (helpfulTips) {
    helpfulTips.checked = read('proglog_pref_helpful_tips', true);
    helpfulTips.addEventListener('change', function () {
      write('proglog_pref_helpful_tips', helpfulTips.checked);
      saveCloudPrefs();
      document.body.classList.toggle('show-helpful-tips', helpfulTips.checked);
    });
    applyToggleState('proglog_pref_helpful_tips', helpfulTips.checked, 'show-helpful-tips');
  }

  if (sessionRecap) {
    sessionRecap.checked = read('proglog_pref_session_recap', true);
    sessionRecap.addEventListener('change', function () {
      write('proglog_pref_session_recap', sessionRecap.checked);
      saveCloudPrefs();
      document.body.classList.toggle('show-session-recap', sessionRecap.checked);
    });
    applyToggleState('proglog_pref_session_recap', sessionRecap.checked, 'show-session-recap');
  }
})();
