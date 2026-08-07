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
# fill BREVO_*, STRIPE_*, GECKODUPE_API_KEY, etc.
npx wrangler d1 create flareform   # or reuse an existing D1
# update wrangler.jsonc ids
npx wrangler kv namespace create FLAREFORM
npm run db:remote
npm run deploy
```

Point the UI at your worker:

```js
localStorage.setItem('flareform_api_base', 'https://YOUR_SUBDOMAIN.workers.dev')
```

## Edge spam / dedupe

Set `GECKODUPE_SPAM_URL` and `GECKODUPE_API_KEY` (a `gd_live_…` key from your Geckodupe account or service registration). Without a key, Flareform falls back to a local spam heuristic and local log fingerprints.
