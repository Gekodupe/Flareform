var inboxItems = [];
var inboxSelectedId = '';

async function fillProjectSelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var current = sel.value;
  try {
    var data = await fbFetch('/v1/projects?sort=name');
    var projects = data.projects || [];
    sel.innerHTML = '<option value="">All projects</option>';
    projects.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + ' (' + p.id + ')';
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  } catch (e) {
    /* leave default */
  }
}

function inboxPreviewValue(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v).slice(0, 40);
  }
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    if (v.every(function (x) {
      return x && typeof x === 'object' && (x.url || x.id);
    })) {
      return v.length === 1 ? '1 image' : v.length + ' images';
    }
    return v.length + ' items';
  }
  if (typeof v === 'object') return '{…}';
  return String(v).slice(0, 40);
}

function inboxPreview(payload) {
  if (!payload || typeof payload !== 'object') return '-';
  var keys = Object.keys(payload).filter(function (k) {
    return !String(k).startsWith('_');
  });
  if (!keys.length) {
    if (payload._images && Array.isArray(payload._images) && payload._images.length) {
      return payload._images.length === 1 ? '1 image' : payload._images.length + ' images';
    }
    return '-';
  }
  var parts = keys.slice(0, 3).map(function (k) {
    return k + ': ' + inboxPreviewValue(payload[k]);
  });
  if (payload._images && Array.isArray(payload._images) && payload._images.length) {
    parts.push(
      payload._images.length === 1 ? '1 image' : payload._images.length + ' images'
    );
  }
  return parts.join(' · ');
}

function inboxQuery(limit) {
  var projectId = (document.getElementById('inbox-project') || {}).value || '';
  var filter = (document.getElementById('inbox-filter') || {}).value || 'all';
  var sort = (document.getElementById('inbox-sort') || {}).value || 'newest';
  var qs =
    '?limit=' +
    (limit || 50) +
    '&filter=' +
    encodeURIComponent(filter) +
    '&sort=' +
    encodeURIComponent(sort);
  if (projectId) qs += '&projectId=' + encodeURIComponent(projectId);
  return qs;
}

async function inboxRefresh() {
  if (!fbIsSignedIn()) {
    showToast('Sign in to view inbox', 'warning');
    return;
  }
  try {
    var data = await fbFetch('/v1/inbox' + inboxQuery(50));
    inboxItems = data.items || [];
    var tbody = document.getElementById('inbox-body');
    if (!tbody) return;
    if (!inboxItems.length) {
      tbody.innerHTML = '<tr><td colspan="4">No submissions match this filter.</td></tr>';
      return;
    }
    tbody.innerHTML = inboxItems
      .map(function (item) {
        return (
          '<tr class="fb-row' +
          (item.id === inboxSelectedId ? ' selected' : '') +
          '" data-id="' +
          escAttr(item.id) +
          '">' +
          '<td data-label="When">' +
          esc(item.createdAt || '') +
          (item.readAt ? '' : ' · unread') +
          '</td>' +
          '<td data-label="Project">' +
          esc(item.projectName || item.projectId || '') +
          '</td>' +
          '<td data-label="Preview">' +
          esc(inboxPreview(item.payload)) +
          '</td>' +
          '<td data-label="Score">' +
          (item.isSpam ? 'spam ' : '') +
          Number(item.spamScore || 0).toFixed(2) +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        inboxSelect(tr.getAttribute('data-id'));
      });
    });
  } catch (e) {
    showToast(e.message || 'Inbox failed', 'error');
  }
}

function inboxSelect(id) {
  inboxSelectedId = id;
  var item = inboxItems.find(function (x) {
    return x.id === id;
  });
  document.querySelectorAll('#inbox-body tr').forEach(function (tr) {
    tr.classList.toggle('selected', tr.getAttribute('data-id') === id);
  });
  if (!item) return;
  if (typeof fbOpenModal !== 'function') {
    showToast('UI dialog unavailable', 'error');
    return;
  }

  var payload = item.payload || {};
  var images = Array.isArray(payload._images) ? payload._images : [];
  var wrap = document.createElement('div');
  wrap.className = 'fb-detail-content';

  var meta = document.createElement('p');
  meta.className = 'fb-modal-meta';
  meta.textContent =
    (item.projectName || item.projectId) +
    ' · ' +
    (item.createdAt || '') +
    ' · score ' +
    Number(item.spamScore || 0).toFixed(2) +
    (item.isSpam ? ' · spam' : '') +
    (item.readAt ? '' : ' · unread');
  wrap.appendChild(meta);

  var imagesEl = document.createElement('div');
  imagesEl.className = 'fb-inbox-images';
  imagesEl.hidden = !images.length;
  wrap.appendChild(imagesEl);

  var displayPayload = Object.assign({}, payload);
  delete displayPayload._images;
  var pre = document.createElement('pre');
  pre.className = 'fb-pre';
  pre.textContent = JSON.stringify(displayPayload, null, 2);
  wrap.appendChild(pre);

  fbOpenModal({
    title: 'Submission',
    body: wrap,
    actions: [
      {
        label: 'Mark read',
        primary: true,
        onClick: function () {
          inboxMarkRead();
        }
      },
      {
        label: 'Toggle spam',
        className: 'secondary-btn',
        onClick: function () {
          inboxToggleSpam();
        }
      },
      {
        label: 'Delete',
        className: 'fb-btn-danger',
        onClick: function () {
          inboxDelete();
        }
      }
    ]
  });

  if (images.length) inboxRenderImages(images, imagesEl);
}

async function inboxRenderImages(images, imagesEl) {
  fbLoadSession();
  if (imagesEl._fbBlobUrls) {
    imagesEl._fbBlobUrls.forEach(function (u) {
      try {
        URL.revokeObjectURL(u);
      } catch (e) { /* ignore */ }
    });
  }
  imagesEl._fbBlobUrls = [];
  imagesEl.textContent = '';
  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    if (!img || !img.id) continue;
    var name = img.name || img.id || 'image';
    var src = '';
    if (fbSession) {
      try {
        var res = await fetch(fbApiBase() + '/v1/files/' + encodeURIComponent(img.id), {
          headers: { Authorization: 'Bearer ' + fbSession }
        });
        if (res.ok) {
          var blob = await res.blob();
          src = URL.createObjectURL(blob);
          imagesEl._fbBlobUrls.push(src);
        }
      } catch (e) {
        src = '';
      }
    } else if (img.token) {
      src =
        fbApiBase() +
        '/v1/files/' +
        encodeURIComponent(img.id) +
        '?t=' +
        encodeURIComponent(img.token);
    }
    if (!src) continue;
    var a = document.createElement('a');
    a.className = 'fb-inbox-image';
    a.href = src;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    var el = document.createElement('img');
    el.src = src;
    el.alt = String(name);
    el.loading = 'lazy';
    a.appendChild(el);
    imagesEl.appendChild(a);
  }
}

async function inboxMarkRead() {
  if (!inboxSelectedId) return;
  try {
    await fbFetch('/v1/inbox/' + inboxSelectedId, { method: 'PATCH', body: { read: true } });
    showToast('Marked read', 'success');
    await inboxRefresh();
    inboxSelect(inboxSelectedId);
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

async function inboxToggleSpam() {
  if (!inboxSelectedId) return;
  var item = inboxItems.find(function (x) {
    return x.id === inboxSelectedId;
  });
  try {
    await fbFetch('/v1/inbox/' + inboxSelectedId, {
      method: 'PATCH',
      body: { isSpam: !(item && item.isSpam) }
    });
    showToast('Updated spam flag', 'success');
    await inboxRefresh();
    inboxSelect(inboxSelectedId);
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

async function inboxDelete() {
  if (!inboxSelectedId) return;
  var ok =
    typeof fbConfirm === 'function'
      ? await fbConfirm('Delete this submission? This cannot be undone.', {
          title: 'Delete submission',
          confirmLabel: 'Delete',
          danger: true
        })
      : window.confirm('Delete this submission?');
  if (!ok) {
    if (inboxSelectedId) inboxSelect(inboxSelectedId);
    return;
  }
  try {
    await fbFetch('/v1/inbox/' + inboxSelectedId, { method: 'DELETE' });
    inboxSelectedId = '';
    if (typeof fbCloseModal === 'function') fbCloseModal();
    showToast('Deleted', 'success');
    await inboxRefresh();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

function inboxExportCsv() {
  inboxExport('csv');
}

function inboxExportJson() {
  inboxExport('json');
}

async function inboxExport(format) {
  if (!fbIsSignedIn()) {
    showToast('Sign in to export', 'warning');
    return;
  }
  try {
    var data = await fbFetch('/v1/inbox' + inboxQuery(500));
    var items = data.items || [];
    if (!items.length) {
      showToast('Nothing to export', 'warning');
      return;
    }
    if (format === 'json') {
      downloadBlob(
        JSON.stringify(items, null, 2),
        'flareform-inbox.json',
        'application/json;charset=utf-8'
      );
      return;
    }
    var lines = ['id,project,projectId,createdAt,isSpam,spamScore,origin,payload'];
    items.forEach(function (item) {
      lines.push(
        [
          csv(item.id),
          csv(item.projectName || ''),
          csv(item.projectId || ''),
          csv(item.createdAt),
          item.isSpam ? '1' : '0',
          item.spamScore,
          csv(item.origin || ''),
          csv(JSON.stringify(item.payload || {}))
        ].join(',')
      );
    });
    downloadBlob(lines.join('\n'), 'flareform-inbox.csv', 'text/csv;charset=utf-8');
  } catch (e) {
    showToast(e.message || 'Export failed', 'error');
  }
}

function downloadBlob(text, filename, type) {
  var blob = new Blob([text], { type: type });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function csv(v) {
  var s = String(v == null ? '' : v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}

async function initInboxTab() {
  var gate = document.getElementById('inbox-auth-gate');
  var workspace = document.getElementById('inbox-workspace');
  fbLoadSession();
  if (!fbIsSignedIn()) {
    fbSetHidden(gate, false);
    fbSetHidden(workspace, true);
    return;
  }
  fbSetHidden(gate, true);
  fbSetHidden(workspace, false);
  await fillProjectSelect('inbox-project');
  ['inbox-filter', 'inbox-project', 'inbox-sort'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && !el.dataset.bound) {
      el.dataset.bound = '1';
      el.addEventListener('change', inboxRefresh);
    }
  });
  await inboxRefresh();
}
