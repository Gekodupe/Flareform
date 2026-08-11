# Security

- Passwords hashed; sessions in KV with expiry
- Auth, support, and ingest rate-limited (Workers Rate Limiting)
- Ingest body size caps (256KB JSON / 12MB multipart)
- Origin allowlist when configured (Referer checked if Origin missing)
- `_next` / `_redirect` restricted to allowlisted origins (or `APP_ORIGIN`)
- Image files require a read token (`?t=`) or owner session; magic-byte checked on upload
- Email verification required to create/change projects, billing, and API keys
- Honeypot fields silently accept spam bots
- Optional Cloudflare Turnstile (fails closed when enabled on a project)
- Edge spam scoring on form (and log) payloads
- Log dedupe to reduce noise and quota abuse
- Do not collect payment cards or regulated health data without a lawful basis

Report issues via [`.well-known/security.txt`](../.well-known/security.txt). See also the in-app **Legal** tab.
