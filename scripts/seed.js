#!/usr/bin/env node
/**
 * Seed demo submissions against a running Flareform Worker.
 * Usage:
 *   node scripts/seed.js
 * Env:
 *   FLAREFORM_API_BASE (default http://127.0.0.1:8787)
 *   FLAREFORM_EMAIL / FLAREFORM_PASSWORD (defaults demo@flareform.local / FlareformDemo1!)
 */
const BASE = process.env.FLAREFORM_API_BASE || 'http://127.0.0.1:8787';
const EMAIL = process.env.FLAREFORM_EMAIL || 'demo@flareform.local';
const PASSWORD = process.env.FLAREFORM_PASSWORD || 'FlareformDemo1!';

async function req(path, opts) {
  opts = opts || {};
  const headers = Object.assign(
    { Accept: 'application/json', 'Content-Type': 'application/json' },
    opts.headers || {}
  );
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

async function main() {
  console.log('Seeding against', BASE);
  let session;
  try {
    const login = await req('/v1/auth/login', {
      method: 'POST',
      body: { email: EMAIL, password: PASSWORD, rememberMe: true }
    });
    session = login.session;
    console.log('Signed in as', EMAIL);
  } catch (e) {
    if (e.status === 401) {
      const reg = await req('/v1/auth/register', {
        method: 'POST',
        body: { email: EMAIL, password: PASSWORD, rememberMe: true }
      });
      session = reg.session;
      console.log('Registered', EMAIL);
    } else {
      throw e;
    }
  }

  const auth = { Authorization: 'Bearer ' + session };
  let projects = (await req('/v1/projects', { headers: auth })).projects || [];
  let project = projects[0];
  if (!project) {
    const created = await req('/v1/projects', {
      method: 'POST',
      headers: auth,
      body: { name: 'Demo Contact Form', allowedOrigins: '' }
    });
    project = created.project;
    console.log('Created project', project.id);
  } else {
    console.log('Using project', project.id);
  }

  const samples = [
    { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Interested in Flareform for our site.' },
    { name: 'Spam Bot', email: 'buy@cheap.pills', message: 'CLICK HERE FREE VIAGRA CRYPTO WINNER!!!' },
    { name: 'Grace Hopper', email: 'grace@navy.mil', message: 'Can we self-host on Cloudflare?' },
    { name: 'Test User', email: 'test@flareform.local', message: 'Hello from seed script.' }
  ];

  for (const fields of samples) {
    const res = await req('/f/' + project.id, { method: 'POST', body: fields });
    console.log('Ingested', res.id, 'spam=' + res.spam, 'score=' + res.score);
  }

  const overview = await req('/v1/overview', { headers: auth });
  console.log('Totals', overview.totals);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err.message || err);
  if (err.body) console.error(err.body);
  process.exit(1);
});
