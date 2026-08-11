# Self-host

## Frontend

```bash
git clone https://github.com/Gekodupe/Flareform.git
cd Flareform
npm install
npm run serve
```

## API Worker

```bash
git clone https://github.com/Gekodupe/FlareformAPI.git
cd FlareformAPI
npm install
cp .dev.vars.example .dev.vars
# fill BREVO_*, STRIPE_*, GECKODUPE_API_KEY, TURNSTILE_SECRET, etc.
npx wrangler d1 create flareboard   # hosted prod uses this D1 name; any name works if wrangler.jsonc matches
# update wrangler.jsonc database_id + KV id
npx wrangler kv namespace create FLAREFORM
# Fresh DB: apply full schema. Existing DB: run ordered migrations.
npm run db:schema:remote
# or: npm run db:migrate:remote
npm run deploy
```

Point the UI at your worker:

```js
localStorage.setItem('flareform_api_base', 'https://YOUR_SUBDOMAIN.workers.dev')
```

## Hardening tips

- Set **allowed origins** on each project (browser posts from other origins are rejected).
- `_next` / `_redirect` only allowlisted origins (or your `APP_ORIGIN` when the allowlist is empty).
- Enable Turnstile only when `TURNSTILE_SECRET` is configured (verification fails closed).
- Auth, support, and ingest are rate-limited via the Workers Rate Limiting binding.
- Verify email before creating projects, opening billing, or minting API keys.
- Image URLs include a read token (`?t=`); do not strip it from `_images`.

## Edge spam / dedupe

Set `GECKODUPE_SPAM_URL` and `GECKODUPE_API_KEY` (a `gd_live_…` key from your Geckodupe account). Without a key, Flareform falls back to a local spam heuristic and local log fingerprints. Dedupe against Geckodupe requires both URL and key. Production uses `SPAM_FAIL_MODE=fail-closed` so spam-API outages do not silently accept mail; local `.dev.vars` may use `fail-open` for easier development.
