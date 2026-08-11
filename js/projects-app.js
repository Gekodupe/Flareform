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
    list.innerHTML = '';
    if (!projects.length) {
      list.innerHTML =
        '<div class="auth-card"><p class="auth-card-title">No projects yet</p>' +
        '<p class="auth-card-desc">Create one above. You will get a form endpoint and an optional log endpoint.</p></div>';
      return;
    }
    var base = fbApiBase();
    projects.forEach(function (p) {
      var url = base + '/f/' + p.id;
      var logUrl = base + '/l/' + p.id;
      var logsOn = Number(p.logs_enabled) === 1;
      var snippet = formSnippet(url);
      var card = document.createElement('div');
      card.className = 'auth-card fb-project-card';
      card.dataset.id = p.id;

      var title = document.createElement('p');
      title.className = 'auth-card-title';
      title.textContent = p.name || '';
      card.appendChild(title);

      var formLabel = document.createElement('p');
      formLabel.className = 'auth-card-desc';
      formLabel.textContent = 'Form endpoint';
      card.appendChild(formLabel);

      var formInput = document.createElement('input');
      formInput.className = 'auth-input';
      formInput.readOnly = true;
      formInput.value = url;
      formInput.addEventListener('focus', function () {
        formInput.select();
      });
      card.appendChild(formInput);

      var formActions = document.createElement('div');
      formActions.className = 'auth-actions auth-actions-wrap';
      formActions.style.marginTop = '10px';
      var copyForm = document.createElement('button');
      copyForm.type = 'button';
      copyForm.className = 'auth-primary';
      copyForm.textContent = 'Copy form endpoint';
      copyForm.addEventListener('click', function () {
        projectsCopy(url);
      });
      var copyHtml = document.createElement('button');
      copyHtml.type = 'button';
      copyHtml.className = 'secondary-btn';
      copyHtml.textContent = 'Copy HTML form';
      copyHtml.addEventListener('click', function () {
        projectsCopySnippet(url);
      });
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'secondary-btn';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function () {
        projectsDelete(p.id);
      });
      formActions.appendChild(copyForm);
      formActions.appendChild(copyHtml);
      formActions.appendChild(delBtn);
      card.appendChild(formActions);

      var logLabel = document.createElement('p');
      logLabel.className = 'auth-card-desc';
      logLabel.style.marginTop = '14px';
      logLabel.textContent = 'Error log endpoint ' + (logsOn ? '(on)' : '(off)');
      card.appendChild(logLabel);

      var logInput = document.createElement('input');
      logInput.className = 'auth-input';
      logInput.readOnly = true;
      logInput.value = logUrl;
      logInput.addEventListener('focus', function () {
        logInput.select();
      });
      card.appendChild(logInput);

      var logActions = document.createElement('div');
      logActions.className = 'auth-actions auth-actions-wrap';
      logActions.style.marginTop = '10px';
      var toggleLogs = document.createElement('button');
      toggleLogs.type = 'button';
      toggleLogs.className = 'secondary-btn';
      toggleLogs.textContent = logsOn ? 'Disable logs' : 'Enable logs';
      toggleLogs.addEventListener('click', function () {
        projectsToggleLogs(p.id, !logsOn);
      });
      logActions.appendChild(toggleLogs);
      if (logsOn) {
        var copyLog = document.createElement('button');
        copyLog.type = 'button';
        copyLog.className = 'secondary-btn';
        copyLog.textContent = 'Copy log snippet';
        copyLog.addEventListener('click', function () {
          projectsCopyLogSnippet(logUrl);
        });
        logActions.appendChild(copyLog);
      }
      card.appendChild(logActions);

      var snipLabel = document.createElement('p');
      snipLabel.className = 'auth-card-desc';
      snipLabel.style.marginTop = '14px';
      snipLabel.textContent = 'HTML form example';
      card.appendChild(snipLabel);
      var pre = document.createElement('pre');
      pre.className = 'fb-pre';
      pre.textContent = snippet;
      card.appendChild(pre);

      var meta = document.createElement('p');
      meta.className = 'auth-card-desc';
      meta.style.marginTop = '10px';
      meta.textContent =
        Number(p.submission_count || 0) +
        ' forms · ' +
        Number(p.log_count || 0) +
        ' logs · ' +
        Number(p.spam_count || 0) +
        ' spam · notify ' +
        (Number(p.notify_enabled) === 0 ? 'off' : p.notify_email || 'owner') +
        ' · Turnstile ' +
        (Number(p.turnstile_enabled) ? 'on' : 'off');
      card.appendChild(meta);
      list.appendChild(card);
    });
  } catch (e) {
    list.textContent = '';
    var err = document.createElement('p');
    err.className = 'auth-card-desc';
    err.textContent = e.message || 'Failed to load';
    list.appendChild(err);
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
  if (!(await (typeof fbConfirm === 'function'
    ? fbConfirm('Delete this project and all submissions/logs? This cannot be undone.', {
        title: 'Delete project',
        confirmLabel: 'Delete',
        danger: true
      })
    : Promise.resolve(window.confirm('Delete this project and all submissions/logs?'))))) {
    return;
  }
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
