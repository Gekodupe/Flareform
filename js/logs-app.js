var logsItems = [];
var logsSelectedId = '';

async function logsFillProjectSelect() {
  var sel = document.getElementById('logs-project');
  if (!sel) return;
  var current = sel.value;
  try {
    var data = await fbFetch('/v1/projects');
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

function logsPreview(payload) {
  if (!payload || typeof payload !== 'object') return '-';
  var msg = payload.message || payload.error || payload.msg || '';
  if (msg) return String(msg).slice(0, 80);
  var keys = Object.keys(payload);
  if (!keys.length) return '-';
  return keys.slice(0, 2).map(function (k) {
    return k + ': ' + String(payload[k]).slice(0, 30);
  }).join(' · ');
}

async function initLogsTab() {
  var gate = document.getElementById('logs-auth-gate');
  var workspace = document.getElementById('logs-workspace');
  if (!fbIsSignedIn()) {
    if (gate) gate.hidden = false;
    if (workspace) workspace.hidden = true;
    return;
  }
  if (gate) gate.hidden = true;
  if (workspace) workspace.hidden = false;
  await logsFillProjectSelect();
  var proj = document.getElementById('logs-project');
  var filter = document.getElementById('logs-filter');
  if (proj && !proj.dataset.bound) {
    proj.dataset.bound = '1';
    proj.addEventListener('change', logsRefresh);
  }
  if (filter && !filter.dataset.bound) {
    filter.dataset.bound = '1';
    filter.addEventListener('change', logsRefresh);
  }
  await logsRefresh();
}

async function logsRefresh() {
  if (!fbIsSignedIn()) {
    showToast('Sign in to view logs', 'warning');
    return;
  }
  var projectId = (document.getElementById('logs-project') || {}).value || '';
  var filter = (document.getElementById('logs-filter') || {}).value || 'all';
  var qs = '?limit=50&filter=' + encodeURIComponent(filter);
  if (projectId) qs += '&projectId=' + encodeURIComponent(projectId);
  try {
    var data = await fbFetch('/v1/logs' + qs);
    logsItems = data.items || [];
    var tbody = document.getElementById('logs-body');
    if (!tbody) return;
    if (!logsItems.length) {
      tbody.innerHTML =
        '<tr><td colspan="5">No logs yet. Enable logging on a project and POST errors to /l/{id}.</td></tr>';
      return;
    }
    tbody.innerHTML = logsItems
      .map(function (item) {
        return (
          '<tr class="fb-row' +
          (item.id === logsSelectedId ? ' selected' : '') +
          '" data-id="' +
          escAttr(item.id) +
          '">' +
          '<td>' +
          esc(item.createdAt || '') +
          (item.readAt ? '' : ' · unread') +
          '</td>' +
          '<td>' +
          esc(item.level || 'error') +
          '</td>' +
          '<td>' +
          esc(item.projectName || item.projectId || '') +
          '</td>' +
          '<td>' +
          esc(logsPreview(item.payload)) +
          '</td>' +
          '<td>' +
          Number(item.occurrenceCount || 1) +
          '</td>' +
          '</tr>'
        );
      })
      .join('');

    tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        logsSelect(tr.getAttribute('data-id'));
      });
    });
  } catch (e) {
    showToast(e.message || 'Logs failed', 'error');
  }
}

function logsSelect(id) {
  logsSelectedId = id;
  var item = logsItems.find(function (x) {
    return x.id === id;
  });
  var detail = document.getElementById('logs-detail');
  if (!item || !detail) return;
  detail.hidden = false;
  var meta = document.getElementById('logs-detail-meta');
  if (meta) {
    meta.textContent =
      (item.projectName || item.projectId) +
      ' · ' +
      (item.level || 'error') +
      ' · ×' +
      Number(item.occurrenceCount || 1) +
      (item.readAt ? '' : ' · unread');
  }
  var pre = document.getElementById('logs-detail-json');
  if (pre) pre.textContent = JSON.stringify(item.payload || {}, null, 2);
}

async function logsMarkRead() {
  if (!logsSelectedId) return;
  try {
    await fbFetch('/v1/logs/' + logsSelectedId, { method: 'PATCH', body: { read: true } });
    showToast('Marked read', 'success');
    await logsRefresh();
  } catch (e) {
    showToast(e.message || 'Update failed', 'error');
  }
}

async function logsDelete() {
  if (!logsSelectedId) return;
  if (!confirm('Delete this log event?')) return;
  try {
    await fbFetch('/v1/logs/' + logsSelectedId, { method: 'DELETE' });
    logsSelectedId = '';
    var detail = document.getElementById('logs-detail');
    if (detail) detail.hidden = true;
    showToast('Deleted', 'success');
    await logsRefresh();
  } catch (e) {
    showToast(e.message || 'Delete failed', 'error');
  }
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
