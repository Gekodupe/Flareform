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

function inboxPreview(payload) {
  if (!payload || typeof payload !== 'object') return '-';
  var keys = Object.keys(payload);
  if (!keys.length) return '-';
  var parts = keys.slice(0, 3).map(function (k) {
    return k + ': ' + String(payload[k]).slice(0, 40);
  });
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
          '<td>' +
          esc(item.createdAt || '') +
          (item.readAt ? '' : ' · unread') +
          '</td>' +
          '<td>' +
          esc(item.projectName || item.projectId || '') +
          '</td>' +
          '<td>' +
          esc(inboxPreview(item.payload)) +
          '</td>' +
          '<td>' +
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
  var detail = document.getElementById('inbox-detail');
  if (!item || !detail) return;
  detail.hidden = false;
  var meta = document.getElementById('inbox-detail-meta');
  if (meta) {
    meta.textContent =
      (item.projectName || item.projectId) +
      ' · ' +
      (item.createdAt || '') +
      ' · score ' +
      Number(item.spamScore || 0).toFixed(2) +
      (item.isSpam ? ' · spam' : '');
  }
  var pre = document.getElementById('inbox-detail-json');
  if (pre) pre.textContent = JSON.stringify(item.payload || {}, null, 2);
  document.querySelectorAll('#inbox-body tr').forEach(function (tr) {
    tr.classList.toggle('selected', tr.getAttribute('data-id') === id);
  });
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
  if (!confirm('Delete this submission?')) return;
  try {
    await fbFetch('/v1/inbox/' + inboxSelectedId, { method: 'DELETE' });
    inboxSelectedId = '';
    var detail = document.getElementById('inbox-detail');
    if (detail) detail.hidden = true;
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
