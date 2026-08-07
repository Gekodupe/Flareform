// Flareform shell: toasts, tab routing, mobile menu

var tabIdToSlug = {};
var tabSlugToId = {};
var PAGE_TITLES = {
  '1': 'Overview',
  '2': 'Inbox',
  '3': 'Analytics',
  '4': 'Projects',
  '5': 'Pricing',
  '6': 'Account',
  '7': 'Legal',
  '8': 'Support',
  '9': 'Error logs',
  '10': 'Docs',
  '11': 'API'
};

function getActivePageTitleEl() {
  var section = document.querySelector('main section.current');
  if (section) return section.querySelector('h1');
  return document.querySelector('h1');
}

function checkMobileToastPosition() {
  var container = document.getElementById('toast-container');
  if (!container) return;
  if (window.innerWidth <= 850) {
    var titleEl = getActivePageTitleEl();
    if (titleEl && titleEl.getBoundingClientRect().bottom < 0) {
      container.classList.add('toast-top-mode');
    } else {
      container.classList.remove('toast-top-mode');
    }
  } else {
    container.classList.remove('toast-top-mode');
  }
}

function showToast(msg, type) {
  var container = document.getElementById('toast-container');
  if (!container) return;
  checkMobileToastPosition();
  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'success');
  var textSpan = document.createElement('span');
  textSpan.innerText = msg;
  function dismissToast() {
    if (!toast.parentNode) return;
    toast.classList.add('toast-hide');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }
  var closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = dismissToast;
  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);
  setTimeout(dismissToast, 5000);
}

function buildTabRoutes() {
  tabIdToSlug = {};
  tabSlugToId = {};
  document.querySelectorAll('.nav-tab-btn[data-slug]').forEach(function (btn) {
    var id = btn.id.replace('t-', '');
    var slug = btn.getAttribute('data-slug');
    if (!id || !slug) return;
    tabIdToSlug[id] = slug;
    tabSlugToId[slug] = id;
  });
}

function getTabIdFromHash() {
  var hash = (location.hash || '').replace(/^#/, '').trim().toLowerCase();
  var q = hash.indexOf('?');
  if (q >= 0) hash = hash.slice(0, q);
  if (hash && tabSlugToId[hash]) return tabSlugToId[hash];
  return '1';
}

function updatePageTitle(tabId) {
  var name = PAGE_TITLES[tabId] || 'Flareform';
  document.title = name + ' - Flareform';
}

function onTabActivated(tabId) {
  if (tabId !== '10' && typeof teardownDocsTab === 'function') {
    teardownDocsTab();
  }
  var ready = typeof ensureTabScripts === 'function' ? ensureTabScripts(tabId) : Promise.resolve();
  ready.then(function () {
    if (tabId === '1' && typeof initOverviewTab === 'function') initOverviewTab();
    if (tabId === '2' && typeof initInboxTab === 'function') initInboxTab();
    if (tabId === '9' && typeof initLogsTab === 'function') initLogsTab();
    if (tabId === '3' && typeof initAnalyticsTab === 'function') initAnalyticsTab();
    if (tabId === '4' && typeof initProjectsTab === 'function') initProjectsTab();
    if (tabId === '5' && typeof initPricingTab === 'function') initPricingTab();
    if (tabId === '6' && typeof initAccountTab === 'function') initAccountTab();
    if (tabId === '8' && typeof initSupportTab === 'function') initSupportTab();
    if (tabId === '10' && typeof initDocsTab === 'function') initDocsTab();
    if (tabId === '11' && typeof initApiKeysTab === 'function') initApiKeysTab();
  });
  if (tabId === '7') {
    var legalPanel = document.getElementById('s-7');
    if (legalPanel && !legalPanel.dataset.tocBound) {
      legalPanel.dataset.tocBound = '1';
      legalPanel.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-legal-scroll]');
        if (!btn) return;
        var target = document.getElementById(btn.getAttribute('data-legal-scroll'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }
}

function switchToTab(tabId, options) {
  options = options || {};
  tabId = String(tabId);
  if (!tabIdToSlug[tabId]) tabId = '1';

  document.querySelectorAll('.nav-tab-btn').forEach(function (btn) {
    btn.classList.remove('current');
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
  });
  document.querySelectorAll('main section').forEach(function (sec) {
    sec.classList.remove('current');
    sec.setAttribute('hidden', '');
  });

  var tabEl = document.getElementById('t-' + tabId);
  var sectionId = tabId;
  if (tabEl && tabEl.getAttribute('aria-controls')) {
    sectionId = tabEl.getAttribute('aria-controls').replace(/^s-/, '');
  }
  var sectionEl = document.getElementById('s-' + sectionId);
  if (tabEl) {
    tabEl.classList.add('current');
    tabEl.setAttribute('aria-selected', 'true');
    tabEl.setAttribute('tabindex', '0');
  }
  if (sectionEl) {
    sectionEl.classList.add('current');
    sectionEl.removeAttribute('hidden');
    window.scrollTo(0, 0);
  }

  if (!options.skipHash) {
    var slug = tabIdToSlug[tabId];
    if (slug) {
      try {
        if (location.hash.replace(/^#/, '').split('?')[0] !== slug) {
          location.hash = slug;
          return;
        }
      } catch (err) { /* ignore */ }
    }
  }

  updatePageTitle(tabId);
  onTabActivated(tabId);
  checkMobileToastPosition();
}

function applyRouteFromHash() {
  var hash = (location.hash || '').replace(/^#/, '').trim().toLowerCase();
  var q = hash.indexOf('?');
  if (q >= 0) hash = hash.slice(0, q);
  if (hash && !tabSlugToId[hash]) {
    history.replaceState(null, '', '#' + (tabIdToSlug['1'] || 'overview'));
  }
  switchToTab(getTabIdFromHash(), { skipHash: true });
}

document.addEventListener('DOMContentLoaded', function () {
  buildTabRoutes();

  document.querySelectorAll('.nav-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabId = btn.id.replace('t-', '');
      if (tabIdToSlug[tabId]) {
        try {
          location.hash = tabIdToSlug[tabId];
        } catch (err) {
          switchToTab(tabId);
        }
      }
    });
  });

  window.addEventListener('hashchange', applyRouteFromHash);

  if (location.hash) {
    applyRouteFromHash();
  } else {
    history.replaceState(null, '', '#' + (tabIdToSlug['1'] || 'overview'));
    switchToTab('1', { skipHash: true });
  }

  var mobileMenuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  var mobileMenuClose = document.getElementById('mobile-menu-close');

  function openMobile() {
    if (mobileMenuOverlay) mobileMenuOverlay.hidden = false;
  }
  function closeMobile() {
    if (mobileMenuOverlay) mobileMenuOverlay.hidden = true;
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobile);
  if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobile);
  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', function (e) {
      if (e.target === mobileMenuOverlay) closeMobile();
    });
  }

  document.querySelectorAll('.mobile-menu-link[data-tab]').forEach(function (link) {
    link.addEventListener('click', function () {
      var tabId = link.getAttribute('data-tab');
      closeMobile();
      if (tabIdToSlug[tabId]) location.hash = tabIdToSlug[tabId];
      else switchToTab(tabId);
    });
  });

  window.addEventListener('scroll', checkMobileToastPosition, { passive: true });
  window.addEventListener('resize', checkMobileToastPosition, { passive: true });
});
