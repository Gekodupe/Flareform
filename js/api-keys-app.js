// Flareform API tab: create, list, and revoke account API keys
var apiKeysLastAccount = null;
var apiKeysInitToken = 0;

function apiKeysGoAccount() {
  if (typeof switchToTab === 'function') switchToTab('6');
}

function apiKeysSetHidden(id, hidden) {
  var el = document.getElementById(id);
  if (!el) return;
  if (hidden) {
    el.setAttribute('hidden', '');
    el.hidden = true;
  } else {
    el.removeAttribute('hidden');
    el.hidden = false;
  }
}

function apiKeysClearSecret() {
  var secretEl = document.getElementById('api-key-secret');
  var reveal = document.getElementById('api-key-reveal');
  if (secretEl) secretEl.value = '';
  apiKeysSetHidden('api-key-reveal', true);
}

function apiKeysSetIntro(signedIn) {
  var intro = document.getElementById('api-tool-intro');
  if (!intro) return;
  intro.textContent = signedIn
    ? 'Create and revoke keys for account APIs. Form and log ingest on /f/{id} and /l/{id} stay public.'
    : 'Sign in to create and revoke API keys for your Flareform account.';
}

function apiKeysRenderSignedOut() {
  apiKeysLastAccount = null;
  apiKeysClearSecret();
  apiKeysSetIntro(false);
  apiKeysSetHidden('api-auth-gate', false);
  apiKeysSetHidden('api-workspace', true);
  var list = document.getElementById('api-key-list');
  if (list) list.innerHTML = '';
  var labelEl = document.getElementById('api-key-label');
  if (labelEl) labelEl.value = '';
}

function apiKeysRenderKeyList(account) {
  var list = document.getElementById('api-key-list');
  if (!list) return;
  list.innerHTML = '';
  var keys = (account && account.keys) || [];
  if (!keys.length) {
    list.innerHTML = '<p class="api-panel-meta api-key-empty">No active keys.</p>';
    return;
  }
  keys.forEach(function (k) {
    var row = document.createElement('div');
    row.className = 'api-key-row';
    var left = document.createElement('div');
    left.innerHTML =
      '<strong class="api-key-label-text">' +
      escApi(k.label || 'Default') +
      '</strong><div class="api-panel-meta">' +
      escApi(String(k.prefix || '').replace(/\u2026/g, '...')) +
      (k.createdAt ? ' · ' + new Date(k.createdAt).toLocaleString() : '') +
      '</div>';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'secondary-btn';
    btn.textContent = 'Revoke';
    btn.setAttribute('aria-label', 'Revoke key ' + (k.label || k.prefix || ''));
    btn.onclick = function () {
      apiKeysRevoke(k.id);
    };
    row.appendChild(left);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

function apiKeysRenderSignedIn(account) {
  if (!account || !account.email) {
    apiKeysRenderSignedOut();
    return;
  }

  apiKeysLastAccount = account;
  apiKeysSetIntro(true);
  apiKeysSetHidden('api-auth-gate', true);
  apiKeysSetHidden('api-workspace', false);

  var usage = account.usage || {};
  var limits = account.limits || {};
  var maxKeys = Number(usage.maxKeys != null ? usage.maxKeys : limits.maxKeys || 0);
  var keyCount = Number(
    usage.keys != null ? usage.keys : (account.keys || []).length
  );
  var verified = account.emailVerified !== false;
  var atLimit = maxKeys > 0 && keyCount >= maxKeys;
  var canCreate = maxKeys > 0 && verified && !atLimit;

  var planEl = document.getElementById('api-user-plan');
  if (planEl) {
    var plan = account.planName || account.plan || 'Free';
    planEl.textContent =
      (account.email || fbEmail || '') +
      ' · ' +
      plan +
      ' · ' +
      keyCount +
      ' / ' +
      maxKeys +
      ' keys';
  }

  var createDesc = document.getElementById('api-create-desc');
  var createRow = document.getElementById('api-create-row');
  var blockedRow = document.getElementById('api-blocked-row');
  var blockedPrimary = document.getElementById('api-blocked-primary');
  var blockedSecondary = document.getElementById('api-blocked-secondary');
  var createBtn = document.getElementById('api-create-btn');

  if (createBtn) createBtn.disabled = !canCreate;

  if (canCreate) {
    apiKeysSetHidden('api-create-row', false);
    apiKeysSetHidden('api-blocked-row', true);
    if (createDesc) {
      createDesc.textContent =
        'Use Authorization: Bearer ff_live_… on /v1/projects, /v1/inbox, /v1/logs, /v1/analytics, and /v1/account.';
    }
  } else {
    apiKeysSetHidden('api-create-row', true);
    apiKeysSetHidden('api-blocked-row', false);
    if (blockedSecondary) apiKeysSetHidden('api-blocked-secondary', true);

    if (!verified) {
      if (createDesc) {
        createDesc.textContent = 'Verify your email on Account before creating API keys.';
      }
      if (blockedPrimary) {
        blockedPrimary.textContent = 'Verify on Account';
        blockedPrimary.onclick = apiKeysGoAccount;
      }
    } else if (maxKeys <= 0) {
      if (createDesc) {
        createDesc.textContent = 'API keys are not available on this plan.';
      }
      if (blockedPrimary) {
        blockedPrimary.textContent = 'View Pricing';
        blockedPrimary.onclick = function () {
          switchToTab('5');
        };
      }
      if (blockedSecondary) {
        apiKeysSetHidden('api-blocked-secondary', false);
        blockedSecondary.textContent = 'Account';
        blockedSecondary.onclick = apiKeysGoAccount;
      }
    } else if (atLimit) {
      if (createDesc) {
        createDesc.textContent =
          'Key limit reached (' + maxKeys + '). Revoke a key or upgrade your plan.';
      }
      if (blockedPrimary) {
        blockedPrimary.textContent = 'View Pricing';
        blockedPrimary.onclick = function () {
          switchToTab('5');
        };
      }
      if (blockedSecondary) {
        apiKeysSetHidden('api-blocked-secondary', false);
        blockedSecondary.textContent = 'Account';
        blockedSecondary.onclick = apiKeysGoAccount;
      }
    }
  }

  apiKeysRenderKeyList(account);
}

async function apiKeysRefreshAccount() {
  var data = await fbFetch('/v1/account');
  apiKeysRenderSignedIn(data);
  return data;
}

async function apiKeysCreate() {
  if (!fbIsSignedIn()) {
    apiKeysRenderSignedOut();
    apiKeysGoAccount();
    return;
  }
  var createBtn = document.getElementById('api-create-btn');
  if (createBtn && createBtn.disabled) return;

  var labelEl = document.getElementById('api-key-label');
  var label = String((labelEl && labelEl.value) || '').trim() || 'Default';
  if (createBtn) createBtn.disabled = true;
  try {
    var res = await fbFetch('/v1/account/keys', { method: 'POST', body: { label: label } });
    var secret = res.apiKey || (res.key && res.key.secret) || '';
    var secretEl = document.getElementById('api-key-secret');
    if (secretEl) secretEl.value = secret;
    apiKeysSetHidden('api-key-reveal', !secret);
    if (labelEl) labelEl.value = '';
    showToast(res.warning || 'API key created - copy it now', 'success');
    await apiKeysRefreshAccount();
  } catch (e) {
    showToast(e.message || 'Could not create key', 'error');
    if (createBtn) createBtn.disabled = false;
    if (e && (e.status === 401 || e.status === 403)) {
      try {
        await apiKeysRefreshAccount();
      } catch (err) {
        apiKeysRenderSignedOut();
      }
    }
  }
}

function apiKeysCopySecret() {
  var secretEl = document.getElementById('api-key-secret');
  var secret = secretEl && secretEl.value;
  if (!secret) {
    showToast('Nothing to copy', 'warning');
    return;
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(secret).then(
      function () {
        showToast('Key copied', 'success');
      },
      function () {
        showToast('Copy failed', 'error');
      }
    );
  } else {
    secretEl.select();
    document.execCommand('copy');
    showToast('Key copied', 'success');
  }
}

async function apiKeysRevoke(id) {
  if (!fbIsSignedIn()) {
    apiKeysRenderSignedOut();
    return;
  }
  if (!id || !confirm('Revoke this API key? Apps using it will stop working.')) return;
  try {
    await fbFetch('/v1/account/keys/' + encodeURIComponent(id), { method: 'DELETE' });
    showToast('Key revoked', 'success');
    apiKeysClearSecret();
    await apiKeysRefreshAccount();
  } catch (e) {
    showToast(e.message || 'Revoke failed', 'error');
    if (e && e.status === 401) apiKeysRenderSignedOut();
  }
}

function escApi(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function initApiKeysTab() {
  var token = ++apiKeysInitToken;
  fbLoadSession();
  apiKeysClearSecret();

  if (!fbIsSignedIn()) {
    apiKeysRenderSignedOut();
    return;
  }

  apiKeysSetHidden('api-auth-gate', true);
  apiKeysSetHidden('api-workspace', true);
  apiKeysSetIntro(true);

  try {
    await apiKeysRefreshAccount();
    if (token !== apiKeysInitToken) return;
  } catch (e) {
    if (token !== apiKeysInitToken) return;
    if (typeof fbSaveSession === 'function' && e && e.status === 401) {
      fbSaveSession('', '');
    }
    apiKeysRenderSignedOut();
    if (e && e.status !== 401) {
      showToast(e.message || 'Could not load API keys', 'error');
    }
  }
}
