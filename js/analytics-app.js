async function initAnalyticsTab() {
  var gate = document.getElementById('analytics-auth-gate');
  var body = document.getElementById('analytics-body');
  fbLoadSession();
  if (!fbIsSignedIn()) {
    fbSetHidden(gate, false);
    fbSetHidden(body, true);
    setText('an-total', '-');
    setText('an-spam', '-');
    setText('an-rate', '-');
    var chart = document.getElementById('analytics-chart');
    if (chart) chart.innerHTML = '<p class="fb-empty-msg">Sign in to load charts.</p>';
    return;
  }
  fbSetHidden(gate, true);
  fbSetHidden(body, false);
  await fillProjectSelect('analytics-project');
  var project = document.getElementById('analytics-project');
  if (project && !project.dataset.bound) {
    project.dataset.bound = '1';
    project.addEventListener('change', analyticsRefresh);
  }
  await analyticsRefresh();
}

async function analyticsRefresh() {
  if (!fbIsSignedIn()) {
    initAnalyticsTab();
    return;
  }
  var projectId = (document.getElementById('analytics-project') || {}).value || '';
  var qs = '?days=30';
  if (projectId) qs += '&projectId=' + encodeURIComponent(projectId);
  var chart = document.getElementById('analytics-chart');
  if (chart) chart.innerHTML = '<p class="fb-empty-msg">Loading...</p>';
  try {
    var data = await fbFetch('/v1/analytics' + qs);
    window._fbAnalyticsCache = data;
    var t = data.totals || {};
    var total = Number(t.submissions || 0);
    var spam = Number(t.spam || 0);
    setText('an-total', total);
    setText('an-spam', spam);
    setText('an-rate', total ? Math.round((spam / total) * 100) + '%' : '0%');
    await renderAnalyticsChart(data.byDay || []);
  } catch (e) {
    if (chart) chart.innerHTML = '<p class="fb-empty-msg">' + (e.message || 'Failed to load') + '</p>';
    var card = document.getElementById('analytics-chart-card');
    if (card) card.classList.add('is-empty');
    showToast(e.message || 'Analytics failed', 'error');
  }
}

async function renderAnalyticsChart(byDay) {
  var el = document.getElementById('analytics-chart');
  var card = document.getElementById('analytics-chart-card');
  if (!el) return;
  el.classList.remove('has-chart');
  if (card) card.classList.add('is-empty');
  el.innerHTML = '';
  if (!byDay.length) {
    el.innerHTML =
      '<p class="fb-empty-msg">No submissions in this range yet. Create a project and POST to its endpoint.</p>';
    return;
  }
  el.classList.add('has-chart');
  if (card) card.classList.remove('is-empty');
  await ensureLib('d3');
  var d3 = window.d3;
  var width = Math.max(280, el.clientWidth || 640);
  var height = 200;
  var margin = { top: 16, right: 16, bottom: 32, left: 40 };
  var data = byDay.map(function (d) {
    return {
      day: d.day,
      total: Number(d.total || 0),
      spam: Number(d.spam || 0)
    };
  });

  var svg = d3
    .select(el)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('role', 'img');

  var x = d3
    .scaleBand()
    .domain(
      data.map(function (d) {
        return d.day;
      })
    )
    .range([margin.left, width - margin.right])
    .padding(0.2);

  var y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return d.total;
      }) || 1
    ])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append('g')
    .attr('fill', '#f7831e')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', function (d) {
      return x(d.day);
    })
    .attr('y', function (d) {
      return y(d.total);
    })
    .attr('height', function (d) {
      return y(0) - y(d.total);
    })
    .attr('width', x.bandwidth());

  svg
    .append('g')
    .attr('fill', '#1a1a1a')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', function (d) {
      return x(d.day);
    })
    .attr('y', function (d) {
      return y(d.spam);
    })
    .attr('height', function (d) {
      return y(0) - y(d.spam);
    })
    .attr('width', Math.max(2, x.bandwidth() * 0.35));

  svg
    .append('g')
    .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
    .call(
      d3.axisBottom(x).tickValues(
        x.domain().filter(function (_, i) {
          return i % Math.ceil(data.length / 7) === 0;
        })
      )
    )
    .attr('font-family', 'Poppins, sans-serif')
    .attr('font-size', 11);

  svg
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',0)')
    .call(d3.axisLeft(y).ticks(5))
    .attr('font-family', 'Poppins, sans-serif')
    .attr('font-size', 11);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val == null ? '-' : String(val);
}

function analyticsExportCsv() {
  var data = window._fbAnalyticsCache;
  if (!data || !(data.byDay || []).length) {
    showToast('Nothing to export', 'warning');
    return;
  }
  var lines = ['day,total,spam,logs'];
  (data.byDay || []).forEach(function (d) {
    lines.push(
      [d.day, Number(d.total || 0), Number(d.spam || 0), Number(d.logs || 0)].join(',')
    );
  });
  var t = data.totals || {};
  lines.push('');
  lines.push('metric,value');
  lines.push('forms,' + Number(t.forms || t.submissions || 0));
  lines.push('spam,' + Number(t.spam || 0));
  lines.push('logs,' + Number(t.logs || 0));
  lines.push('unread,' + Number(t.unread || 0));
  lines.push('projects,' + Number(t.projects || 0));
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'flareform-analytics.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function fillProjectSelect(selectId) {
  var sel = document.getElementById(selectId);
  if (!sel) return;
  var current = sel.value;
  try {
    var data = await fbFetch('/v1/projects?sort=name');
    sel.innerHTML = '<option value="">All projects</option>';
    (data.projects || []).forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      sel.appendChild(opt);
    });
    if (current) sel.value = current;
  } catch (e) {
    /* ignore */
  }
}
