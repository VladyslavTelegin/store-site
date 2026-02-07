/**
 * vtsoft i18n — lightweight translation engine
 * - Detects language: ?lang= → localStorage → navigator.language → "en"
 * - Fetches JSON, swaps [data-i18n] text, [data-i18n-placeholder], [data-i18n-aria]
 * - Auto-sets dir="rtl" for Arabic
 * - Exposes window.vtI18n for programmatic use
 */
(function () {
  'use strict';

  var RTL_LANGS = ['ar'];
  var SUPPORTED = [
    'en','es','de','fr','it','pt-BR','ja','ko',
    'pl','uk','ru','tr','nl','sv',
    'zh-CN','zh-TW','ar','hi'
  ];

  function getBase() {
    var meta = document.querySelector('meta[name="i18n-base"]');
    return meta ? meta.getAttribute('content') : '.';
  }

  function detectLang() {
    var params = new URLSearchParams(window.location.search);
    var param = params.get('lang');
    if (param && SUPPORTED.indexOf(param) !== -1) return param;

    var stored = localStorage.getItem('vtlang');
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var nav = (navigator.language || '').replace('_', '-');
    if (SUPPORTED.indexOf(nav) !== -1) return nav;

    var short = nav.split('-')[0];
    for (var i = 0; i < SUPPORTED.length; i++) {
      if (SUPPORTED[i] === short || SUPPORTED[i].split('-')[0] === short) {
        return SUPPORTED[i];
      }
    }
    return 'en';
  }

  function applyDir(lang) {
    var rtl = RTL_LANGS.indexOf(lang) !== -1;
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }

  function applyTranslations(data) {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (data[key] !== undefined) {
        els[i].textContent = data[key];
      }
    }

    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholders.length; j++) {
      var pk = placeholders[j].getAttribute('data-i18n-placeholder');
      if (data[pk] !== undefined) {
        placeholders[j].setAttribute('placeholder', data[pk]);
      }
    }

    var arias = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < arias.length; k++) {
      var ak = arias[k].getAttribute('data-i18n-aria');
      if (data[ak] !== undefined) {
        arias[k].setAttribute('aria-label', data[ak]);
      }
    }
  }

  function setLangSwitcher(lang) {
    var sel = document.querySelector('.lang-switcher');
    if (sel) sel.value = lang;
  }

  function load(lang) {
    if (lang === 'en') {
      applyDir('en');
      setLangSwitcher('en');
      localStorage.setItem('vtlang', 'en');
      return Promise.resolve();
    }

    var base = getBase();
    var url = base + '/i18n/' + lang + '.json';

    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('i18n: ' + r.status);
        return r.json();
      })
      .then(function (data) {
        applyDir(lang);
        applyTranslations(data);
        setLangSwitcher(lang);
        localStorage.setItem('vtlang', lang);
      })
      .catch(function () {
        // Fallback to English silently
        applyDir('en');
        setLangSwitcher('en');
      });
  }

  function init() {
    var lang = detectLang();
    load(lang);

    document.addEventListener('change', function (e) {
      if (e.target && e.target.classList.contains('lang-switcher')) {
        load(e.target.value);
      }
    });
  }

  window.vtI18n = {
    load: load,
    detect: detectLang,
    supported: SUPPORTED
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
