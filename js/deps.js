// Lazy-load libraries and tab scripts for Flareform
(function (global) {
  var LIBS = {
    d3: 'https://d3js.org/d3.v7.min.js'
  };

  var pending = {};

  function isLoaded(name) {
    if (name === 'd3') return typeof global.d3 !== 'undefined';
    return false;
  }

  function loadScript(url) {
    if (pending[url]) return pending[url];
    pending[url] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load ' + url)); };
      document.head.appendChild(s);
    });
    return pending[url];
  }

  function ensureLib(name) {
    var url = LIBS[name];
    if (!url) return Promise.reject(new Error('Unknown library: ' + name));
    if (isLoaded(name)) return Promise.resolve();
    return loadScript(url);
  }

  global.ensureLib = ensureLib;

  var TAB_SCRIPTS = {
    '1': ['js/overview-app.js'],
    '2': ['js/inbox-app.js'],
    '3': ['js/analytics-app.js'],
    '4': ['js/projects-app.js'],
    '5': ['js/pricing-app.js'],
    '6': ['js/account-app.js'],
    '8': ['js/support-app.js'],
    '9': ['js/logs-app.js'],
    '10': ['js/docs-app.js'],
    '11': ['js/api-keys-app.js']
  };
  var tabScriptLoads = {};

  function loadAppScript(src) {
    if (tabScriptLoads[src]) return tabScriptLoads[src];
    tabScriptLoads[src] = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-lazy-src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === 'true') return resolve();
        existing.addEventListener('load', function () { resolve(); }, { once: true });
        existing.addEventListener('error', function () { reject(new Error('Failed to load ' + src)); }, { once: true });
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.dataset.lazySrc = src;
      s.onload = function () {
        s.dataset.loaded = 'true';
        resolve();
      };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.body.appendChild(s);
    });
    return tabScriptLoads[src];
  }

  function ensureTabScripts(tabId) {
    var scripts = TAB_SCRIPTS[String(tabId)];
    if (!scripts || !scripts.length) return Promise.resolve();
    return Promise.all(scripts.map(loadAppScript));
  }

  global.ensureTabScripts = ensureTabScripts;

  function activateAsyncStylesheets() {
    document.querySelectorAll('link[data-async-css]').forEach(function (link) {
      link.media = 'all';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', activateAsyncStylesheets);
  } else {
    activateAsyncStylesheets();
  }
})(typeof window !== 'undefined' ? window : global);
