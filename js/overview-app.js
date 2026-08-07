async function initOverviewTab() {
  var gate = document.getElementById('overview-auth-gate');
  var body = document.getElementById('overview-body');
  fbLoadSession();
  if (!fbIsSignedIn()) {
    fbSetHidden(gate, false);
    fbSetHidden(body, true);
    return;
  }
  fbSetHidden(gate, true);
  fbSetHidden(body, false);

  try {
    var data = await fbFetch('/v1/overview');
    var t = data.totals || {};
    setText('ov-projects', t.projects);
    setText('ov-subs', t.forms != null ? t.forms : t.submissions);
    setText('ov-logs', t.logs);
    setText('ov-spam', t.spam);
    setText('ov-unread', t.unread);

    var tbody = document.getElementById('overview-recent-body');
    if (!tbody) return;
    var rows = data.recent || [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4">No activity yet. Create a project and POST to its form or log endpoint.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        var kind = r.kind === 'log' ? 'Log' : r.is_spam ? 'Spam' : 'Form';
        return (
          '<tr>' +
          '<td>' +
          esc(r.created_at || '') +
          '</td>' +
          '<td>' +
          esc(r.project_name || r.project_id || '') +
          '</td>' +
          '<td>' +
          kind +
          '</td>' +
          '<td>' +
          esc(r.origin || '-') +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  } catch (e) {
    if (e.status === 401) {
      fbSetHidden(gate, false);
      fbSetHidden(body, true);
      return;
    }
    showToast(e.message || 'Could not load overview', 'error');
  }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val == null ? '-' : String(val);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
