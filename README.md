# Flareform

Open-source **Formspree alternative** — hosted form endpoints, error logs, submissions inbox, email notifications, and analytics on Cloudflare.

## Local development

```bash
cd Flareform/FlareformWebsite
npm install
npm --prefix worker install
npm run db:local
# Edit worker/.dev.vars (copy from .dev.vars.example)
npm run worker:dev          # :8787
npm run serve               # :4173
npm run seed                # optional
```

```js
localStorage.setItem('flareform_api_base', 'http://127.0.0.1:8787')
```

## Production API

Worker: `https://flareform-api.nic-58f.workers.dev`

Optional secret `GECKODUPE_API_KEY` — Bearer token for the edge spam/dedupe API. Without it, Flareform uses a local spam heuristic and local log fingerprint dedupe.

| Endpoint | Purpose |
|----------|---------|
| `POST /f/{projectId}` | Form submissions |
| `POST /l/{projectId}` | Error logs (when enabled on the project) |
| `GET /v1/inbox` | Form inbox |
| `GET /v1/logs` | Deduped worryful logs |

## Features

- Auth (password + magic code)
- Projects with Formspree-style form endpoints
- Optional error logging (enable/disable per project; counts toward quota; duplicates collapsed)
- Honeypot, optional Turnstile, origin allowlist
- Edge spam scoring on ingest
- Inbox, Logs, Overview, Analytics
- Stripe checkout / customer portal
- Support + Legal

## Related

**Flareboard** (multi-site admin panel) is a separate future product.
