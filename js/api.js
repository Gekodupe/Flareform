// Shared Flareform API client + session storage
function fbResolveApiBase() {
  var host =
    typeof location !== 'undefined' ? String(location.hostname || '') : '';
  var isLocal = host === '127.0.0.1' || host === 'localhost';
  // Only honor localStorage override on localhost (prevents XSS → token exfil via fake API)
  if (isLocal && typeof localStorage !== 'undefined') {
    try {
      var override = localStorage.getItem('flareform_api_base');
      if (override && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/i.test(override.replace(/\/+$/, ''))) {
        return override.replace(/\/+$/, '');
      }
      if (override && /^https?:\/\/(127\.0\.0\.1|localhost):\d+$/i.test(override)) {
        return override.replace(/\/+$/, '');
      }
    } catch (e) { /* ignore */ }
  }
  if (isLocal) return 'http://127.0.0.1:8787';
  return 'https://flareform-api.nic-58f.workers.dev';
}

var FLAREFORM_API_BASE = fbResolveApiBase();

var fbSession = '';
var fbEmail = '';

function fbStorageKey(name) {
  return 'flareform_' + name;
}

function fbPersistentStore(remember) {
  try {
    if (remember === false) return sessionStorage;
    if (remember === true) return localStorage;
    // Prefer whichever already has a session
    if (sessionStorage.getItem(fbStorageKey('session'))) return sessionStorage;
    return localStorage;
  } catch (e) {
    return localStorage;
  }
}

function fbLoadSession() {
  try {
    var store = fbPersistentStore();
    fbSession = store.getItem(fbStorageKey('session')) || '';
    fbEmail = store.getItem(fbStorageKey('email')) || '';
    if (!fbSession && store !== localStorage) {
      fbSession = localStorage.getItem(fbStorageKey('session')) || '';
      fbEmail = localStorage.getItem(fbStorageKey('email')) || '';
    }
    if (!fbSession && store !== sessionStorage) {
      fbSession = sessionStorage.getItem(fbStorageKey('session')) || '';
      fbEmail = sessionStorage.getItem(fbStorageKey('email')) || '';
    }
  } catch (e) {
    fbSession = '';
    fbEmail = '';
  }
}

function fbSaveSession(session, email, rememberMe) {
  fbSession = session || '';
  fbEmail = email || '';
  try {
    localStorage.removeItem(fbStorageKey('session'));
    localStorage.removeItem(fbStorageKey('email'));
    sessionStorage.removeItem(fbStorageKey('session'));
    sessionStorage.removeItem(fbStorageKey('email'));
    if (fbSession) {
      var store = rememberMe ? localStorage : sessionStorage;
      store.setItem(fbStorageKey('session'), fbSession);
      store.setItem(fbStorageKey('email'), fbEmail);
    }
  } catch (e) { /* ignore */ }
}

function fbIsSignedIn() {
  fbLoadSession();
  return !!fbSession;
}

function fbSetHidden(el, hidden) {
  if (!el) return;
  if (hidden) {
    el.setAttribute('hidden', '');
    el.hidden = true;
  } else {
    el.removeAttribute('hidden');
    el.hidden = false;
  }
}

async function fbFetch(path, opts) {
  opts = opts || {};
  fbLoadSession();
  var headers = Object.assign(
    {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    opts.headers || {}
  );
  if (fbSession) headers.Authorization = 'Bearer ' + fbSession;
  var res;
  try {
    res = await fetch(FLAREFORM_API_BASE + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body != null ? JSON.stringify(opts.body) : undefined
    });
  } catch (e) {
    var net = new Error('Network error - could not reach Flareform API');
    net.status = 0;
    throw net;
  }
  var text = '';
  try {
    text = await res.text();
  } catch (e) {
    text = '';
  }
  var data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = { error: res.status >= 500 ? 'Server error - try again in a moment' : 'Invalid response' };
  }
  if (!res.ok) {
    var err = new Error((data && (data.error || data.message)) || 'Request failed (' + res.status + ')');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data || {};
}

function fbApiBase() {
  return FLAREFORM_API_BASE;
}

fbLoadSession();
