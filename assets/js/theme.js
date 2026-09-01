// Proglog Theme Engine — the selected profile accent drives the entire interface.
(function () {
  'use strict';

  var DEFAULT = '#7126a6';

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function hexToRgb(hex) {
    var h = String(hex || '').replace('#','');
    if (h.length === 3) h = h.split('').map(function(c){ return c+c; }).join('');
    var n = parseInt(h, 16);
    if (!isFinite(n)) return {r:113,g:38,b:166};
    return { r:(n >> 16) & 255, g:(n >> 8) & 255, b:n & 255 };
  }
  function mix(a,b,t) { return Math.round(a + (b-a)*t); }
  function rgba(rgb,a) { return 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+a+')'; }
  function luminance(rgb) {
    var f=function(v){ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); };
    return .2126*f(rgb.r)+.7152*f(rgb.g)+.0722*f(rgb.b);
  }

  function applyProglogTheme(color) {
    var c = color || DEFAULT;
    var rgb = hexToRgb(c);
    var dark = luminance(rgb) < 0.48;
    var root = document.documentElement;
    root.style.setProperty('--brand-primary', c);
    root.style.setProperty('--brand-hover', '#'+[mix(rgb.r,0,.10),mix(rgb.g,0,.10),mix(rgb.b,0,.10)].map(function(v){return v.toString(16).padStart(2,'0')}).join(''));
    root.style.setProperty('--brand-glow', rgba(rgb,.16));
    root.style.setProperty('--brand-soft', rgba(rgb,.09));
    root.style.setProperty('--brand-border', rgba(rgb,.30));
    root.style.setProperty('--brand-accent', c);
    root.style.setProperty('--brand-gradient', 'linear-gradient(135deg, '+c+' 0%, '+c+' 100%)');
    root.style.setProperty('--accent-warm', '#f89b2c');
    root.style.setProperty('--brand-contrast', dark ? '#ffffff' : '#082016');
    root.dataset.accent = c;
    try { localStorage.setItem('proglog_preview_color', c); } catch(e) {}
  }

  function readColor() {
    try {
      var raw = localStorage.getItem('proglog_session') || localStorage.getItem('platvault_session');
      if (raw) {
        var s = JSON.parse(raw);
        if (s && s.color) return s.color;
      }
      return localStorage.getItem('proglog_preview_color') || DEFAULT;
    } catch(e) { return DEFAULT; }
  }

  window.applyProglogTheme = applyProglogTheme;
  applyProglogTheme(readColor());
})();
