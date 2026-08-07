# API reference

Base URL (hosted): `https://flareform-api.nic-58f.workers.dev`

Auth for account routes: `Authorization: Bearer sess_...` (from login/register).

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

## Projects

| Method | Path |
|--------|------|
| GET | `/v1/projects` |
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
| GET | `/v1/inbox?filter=&projectId=` |
| PATCH | `/v1/inbox/{id}` `{ "read": true }` / `{ "spam": true }` |
| DELETE | `/v1/inbox/{id}` |
| GET | `/v1/logs?filter=&projectId=` |
| PATCH/DELETE | `/v1/logs/{id}` |

## Files

`GET /v1/files/{img_id}` — public image bytes from a submission.

## Analytics

`GET /v1/overview` · `GET /v1/analytics?days=30`

## Billing

| Method | Path |
|--------|------|
| GET | `/v1/billing/plans` |
| POST | `/v1/billing/checkout` `{ "plan": "starter" }` |
| POST | `/v1/billing/portal` |
| POST | `/v1/billing/webhook` | Stripe |

## Support

`POST /v1/support` `{ name, email, topic, message }`
