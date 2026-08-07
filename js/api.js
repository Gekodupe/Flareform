// Shared Flareform API client + session storage
var FLAREFORM_API_BASE =
  (typeof localStorage !== 'undefined' && localStorage.getItem('flareform_api_base')) ||
  (typeof location !== 'undefined' &&
  (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8787'
    : 'https://flareform-api.nic-58f.workers.dev');

var fbSession = '';
var fbEmail = '';

function fbStorageKey(name) {
  return 'flareform_' + name;
}

function fbLoadSession() {
  try {
    fbSession = localStorage.getItem(fbStorageKey('session')) || '';
    fbEmail = localStorage.getItem(fbStorageKey('email')) || '';
  } catch (e) {
    fbSession = '';
    fbEmail = '';
  }
}

function fbSaveSession(session, email) {
  fbSession = session || '';
  fbEmail = email || '';
  try {
    if (fbSession) {
      localStorage.setItem(fbStorageKey('session'), fbSession);
      localStorage.setItem(fbStorageKey('email'), fbEmail);
    } else {
      localStorage.removeItem(fbStorageKey('session'));
      localStorage.removeItem(fbStorageKey('email'));
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
