# API reference

Base URL (hosted): `https://flareform-api.nic-58f.workers.dev`

Auth for account routes:

- Session: `Authorization: Bearer sess_...` (from login/register)
- API key: `Authorization: Bearer ff_live_...` (create keys in the **API** tab)

Form and log ingest (`/f/{id}`, `/l/{id}`) stay public — no API key required.

## Health

`GET /v1/health`

## Auth

| Method | Path | Notes |
|--------|------|-------|
| POST | `/v1/auth/register` | `{ email, password, rememberMe? }` |
| POST | `/v1/auth/login` | `{ email, password, rememberMe? }` |
| POST | `/v1/auth/start` | Magic code |
| POST | `/v1/auth/verify` | `{ token }` or `{ email, code }` |
| POST | `/v1/auth/forgot` | Password reset email |
| POST | `/v1/auth/reset` | `{ token, password }` |
| POST | `/v1/auth/logout` | |
| GET | `/v1/auth/me` | Current session |

## Account & API keys

| Method | Path | Notes |
|--------|------|-------|
| GET | `/v1/account` | Plan, usage, keys (prefixes only) |
| GET | `/v1/account/keys` | List keys |
| POST | `/v1/account/keys` | `{ "label": "Production" }` — returns full key once |
| DELETE | `/v1/account/keys/{id}` | Revoke |

Email must be verified to create keys. Limits: Free 2 · Starter 5 · Pro 10.

## Projects

| Method | Path |
|--------|------|
| GET | `/v1/projects?sort=newest\|oldest\|name\|submissions` |
| POST | `/v1/projects` |
| GET/PATCH/DELETE | `/v1/projects/{id}` |

Create body:

```json
{
  "name": "Contact",
  "allowedOrigins": "https://example.com",
  "notifyEmail": "you@example.com",
  "notifyEnabled": true,
  "turnstileEnabled": false,
  "logsEnabled": true
}
```

## Form ingest

`POST /f/{projectId}`

- `application/json` or `application/x-www-form-urlencoded` or `multipart/form-data`
- Honeypot: `_gotcha`, `_honey`, or `_honeypot`
- Redirect: `_next` / `_redirect` (HTML form posts)
- Images: multipart file fields (`image/jpeg`, `png`, `gif`, `webp`, max 2MB each, max 5)

Response:

```json
{ "ok": true, "id": "sub_...", "spam": false, "score": 0.12, "images": [] }
```

## Log ingest

`POST /l/{projectId}` or `POST /f/{projectId}/log`

Requires `logsEnabled` on the project. Levels: `error`, `fatal`, `critical`, `warn`.

```json
{ "level": "error", "message": "...", "stack": "...", "url": "..." }
```

Duplicates collapse (`occurrenceCount` bumps; no extra quota).

## Inbox & logs

| Method | Path |
|--------|------|
| GET | `/v1/inbox?filter=&projectId=&sort=&limit=` |
| PATCH | `/v1/inbox/{id}` `{ "read": true }` / `{ "spam": true }` |
| DELETE | `/v1/inbox/{id}` |
| GET | `/v1/logs?filter=&projectId=&sort=&limit=` |
| PATCH/DELETE | `/v1/logs/{id}` |

Sort values: `newest`, `oldest`, `project`, `score` (inbox) / `count` (logs), `level` (logs). Limit up to 500 for exports.

## Files

`GET /v1/files/{img_id}` — public image bytes from a submission.

## Analytics

`GET /v1/overview` · `GET /v1/analytics?days=30&projectId=`

## Billing

| Method | Path |
|--------|------|
| GET | `/v1/billing/plans` |
| POST | `/v1/billing/checkout` `{ "plan": "starter" }` |
| POST | `/v1/billing/portal` |
| POST | `/v1/billing/webhook` | Stripe |

## Support

`POST /v1/support` `{ name, email, topic, message }`
