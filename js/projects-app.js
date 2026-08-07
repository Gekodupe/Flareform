async function initProjectsTab() {
  var gate = document.getElementById('projects-auth-gate');
  var workspace = document.getElementById('projects-workspace');
  fbLoadSession();
  if (!fbIsSignedIn()) {
    if (gate) {
      gate.removeAttribute('hidden');
      gate.hidden = false;
    }
    if (workspace) {
      workspace.setAttribute('hidden', '');
      workspace.hidden = true;
    }
    return;
  }
  if (gate) {
    gate.setAttribute('hidden', '');
    gate.hidden = true;
  }
  if (workspace) {
    workspace.removeAttribute('hidden');
    workspace.hidden = false;
  }
  var notify = document.getElementById('project-notify');
  if (notify && !notify.value && fbEmail) notify.value = fbEmail;
  var sort = document.getElementById('projects-sort');
  if (sort && !sort.dataset.bound) {
    sort.dataset.bound = '1';
    sort.addEventListener('change', projectsRefresh);
  }
  await projectsRefresh();
}

async function projectsCreate() {
  if (!fbIsSignedIn()) {
    showToast('Sign in first', 'warning');
    switchToTab('6');
    return;
  }
  var name = String((document.getElementById('project-name') || {}).value || '').trim();
  var origins = String((document.getElementById('project-origins') || {}).value || '').trim();
  var notifyEmail = String((document.getElementById('project-notify') || {}).value || '').trim();
  var notifyOn = !!(document.getElementById('project-notify-on') || {}).checked;
  var turnstile = !!(document.getElementById('project-turnstile') || {}).checked;
  var logsOn = !!(document.getElementById('project-logs-on') || {}).checked;
  if (!name) {
    showToast('Project name required', 'warning');
    return;
  }
  try {
    var res = await fbFetch('/v1/projects', {
      method: 'POST',
      body: {
        name: name,
        allowedOrigins: origins,
        turnstileEnabled: turnstile,
        notifyEmail: notifyEmail || fbEmail,
        notifyEnabled: notifyOn,
        logsEnabled: logsOn
      }
    });
    showToast('Project created - copy your endpoints below', 'success');
    var nameEl = document.getElementById('project-name');
    if (nameEl) nameEl.value = '';
    await projectsRefresh();
    if (res.project && res.project.id) {
      var url = fbApiBase() + '/f/' + res.project.id;
      projectsCopy(url);
    }
  } catch (e) {
    showToast(e.message || 'Create failed', 'error');
  }
}

function formSnippet(url) {
  return (
    '<form action="' +
    url +
    '" method="POST">\n' +
    '  <input type="text" name="name" placeholder="Name" required>\n' +
    '  <input type="email" name="email" placeholder="Email" required>\n' +
    '  <textarea name="message" placeholder="Message" required></textarea>\n' +
    '  <input type="text" name="_gotcha" style="display:none">\n' +
    '  <button type="submit">Send</button>\n' +
    '</form>'
  );
}

function logSnippet(url) {
  return (
    'fetch("' +
    url +
    '", {\n' +
    '  method: "POST",\n' +
    '  headers: { "Content-Type": "application/json" },\n' +
    '  body: JSON.stringify({\n' +
    '    level: "error",\n' +
    '    message: err.message,\n' +
    '    stack: err.stack,\n' +
    '    url: location.href\n' +
    '  })\n' +
    '});'
  );
}

async function projectsToggleLogs(id, enabled) {
  try {
    await fbFetch('/v1/projects/' + id, {
      method: 'PATCH',
      body: { logsEnabled: !!enabled }
    });
    showToast(enabled ? 'Logs enabled' : 'Logs disabled', 'success');
    await projectsRefresh();
  } catch (e) {
    showToast(e.message || 'Update failed', 'error');
  }
}

async function projectsRefresh() {
  var list = document.getElementById('projects-list');
  if (!list) return;
  try {
    var sort = (document.getElementById('projects-sort') || {}).value || 'newest';
    var data = await fbFetch('/v1/projects?sort=' + encodeURIComponent(sort));
    var projects = data.projects || [];
    window._fbProjectsCache = projects;
    if (!projects.length) {
      list.innerHTML =
        '<div class="auth-card"><p class="auth-card-title">No projects yet</p>' +
        '<p class="auth-card-desc">Create one above. You will get a form endpoint and an optional log endpoint.</p></div>';
      return;
    }
    var base = fbApiBase();
    list.innerHTML = projects
      .map(function (p) {
        var url = base + '/f/' + p.id;
        var logUrl = base + '/l/' + p.id;
        var logsOn = Number(p.logs_enabled) === 1;
        var snippet = formSnippet(url);
        return (
          '<div class="auth-card fb-project-card" data-id="' +
          escAttr(p.id) +
          '">' +
          '<p class="auth-card-title">' +
          esc(p.name) +
          '</p>' +
          '<p class="auth-card-desc">Form endpoint</p>' +
          '<input class="auth-input" readonly value="' +
          escAttr(url) +
          '" onclick="this.select()">' +
          '<div class="auth-actions auth-actions-wrap" style="margin-top:10px;">' +
          '<button type="button" class="auth-primary" onclick="projectsCopy(\'' +
          escAttr(url) +
          '\')">Copy form endpoint</button>' +
          '<button type="button" class="secondary-btn" onclick="projectsCopySnippet(\'' +
          escAttr(url) +
          '\')">Copy HTML form</button>' +
          '<button type="button" class="secondary-btn" onclick="projectsDelete(\'' +
          escAttr(p.id) +
          '\')">Delete</button>' +
          '</div>' +
          '<p class="auth-card-desc" style="margin-top:14px;">Error log endpoint ' +
          (logsOn ? '(on)' : '(off)') +
          '</p>' +
          '<input class="auth-input" readonly value="' +
          escAttr(logUrl) +
          '" onclick="this.select()">' +
          '<div class="auth-actions auth-actions-wrap" style="margin-top:10px;">' +
          '<button type="button" class="secondary-btn" onclick="projectsToggleLogs(\'' +
          escAttr(p.id) +
          "', " +
          (logsOn ? 'false' : 'true') +
          ')">' +
          (logsOn ? 'Disable logs' : 'Enable logs') +
          '</button>' +
          (logsOn
            ? '<button type="button" class="secondary-btn" onclick="projectsCopyLogSnippet(\'' +
              escAttr(logUrl) +
              '\')">Copy log snippet</button>'
            : '') +
          '</div>' +
          '<p class="auth-card-desc" style="margin-top:14px;">HTML form example</p>' +
          '<pre class="fb-pre">' +
          esc(snippet) +
          '</pre>' +
          '<p class="auth-card-desc" style="margin-top:10px;">' +
          Number(p.submission_count || 0) +
          ' forms · ' +
          Number(p.log_count || 0) +
          ' logs · ' +
          Number(p.spam_count || 0) +
          ' spam · notify ' +
          (Number(p.notify_enabled) === 0 ? 'off' : esc(p.notify_email || 'owner')) +
          ' · Turnstile ' +
          (Number(p.turnstile_enabled) ? 'on' : 'off') +
          '</p>' +
          '</div>'
        );
      })
      .join('');
  } catch (e) {
    list.innerHTML = '<p class="auth-card-desc">' + esc(e.message || 'Failed to load') + '</p>';
  }
}

function projectsCopy(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(
      function () {
        showToast('Copied endpoint', 'success');
      },
      function () {
        showToast(url, 'success');
      }
    );
  } else {
    showToast(url, 'success');
  }
}

function projectsCopySnippet(url) {
  var snip = formSnippet(url);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(snip).then(
      function () {
        showToast('Copied HTML form', 'success');
      },
      function () {
        showToast('Could not copy', 'error');
      }
    );
  }
}

function projectsCopyLogSnippet(url) {
  var snip = logSnippet(url);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(snip).then(
      function () {
        showToast('Copied log snippet', 'success');
      },
      function () {
        showToast('Could not copy', 'error');
      }
    );
  }
}

async function projectsDelete(id) {
  if (!confirm('Delete this project and all submissions/logs?')) return;
  try {
    await fbFetch('/v1/projects/' + id, { method: 'DELETE' });
    showToast('Project deleted', 'success');
    await projectsRefresh();
  } catch (e) {
    showToast(e.message || 'Delete failed', 'error');
  }
}

function projectsExportCsv() {
  var projects = window._fbProjectsCache || [];
  if (!projects.length) {
    showToast('Nothing to export', 'warning');
    return;
  }
  var base = fbApiBase();
  var lines = ['id,name,formEndpoint,logEndpoint,forms,logs,spam,logsEnabled,notifyEmail,createdAt'];
  projects.forEach(function (p) {
    lines.push(
      [
        csvCell(p.id),
        csvCell(p.name),
        csvCell(base + '/f/' + p.id),
        csvCell(base + '/l/' + p.id),
        Number(p.submission_count || 0),
        Number(p.log_count || 0),
        Number(p.spam_count || 0),
        Number(p.logs_enabled) === 1 ? '1' : '0',
        csvCell(p.notify_email || ''),
        csvCell(p.created_at || '')
      ].join(',')
    );
  });
  downloadProjectsBlob(lines.join('\n'), 'flareform-projects.csv', 'text/csv;charset=utf-8');
}

function projectsExportJson() {
  var projects = window._fbProjectsCache || [];
  if (!projects.length) {
    showToast('Nothing to export', 'warning');
    return;
  }
  var base = fbApiBase();
  var out = projects.map(function (p) {
    return {
      id: p.id,
      name: p.name,
      formEndpoint: base + '/f/' + p.id,
      logEndpoint: base + '/l/' + p.id,
      submissionCount: Number(p.submission_count || 0),
      logCount: Number(p.log_count || 0),
      spamCount: Number(p.spam_count || 0),
      logsEnabled: Number(p.logs_enabled) === 1,
      notifyEmail: p.notify_email || '',
      createdAt: p.created_at || ''
    };
  });
  downloadProjectsBlob(JSON.stringify(out, null, 2), 'flareform-projects.json', 'application/json;charset=utf-8');
}

function downloadProjectsBlob(text, filename, type) {
  var blob = new Blob([text], { type: type });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function csvCell(v) {
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
