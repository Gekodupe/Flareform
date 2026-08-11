# Security

- Passwords hashed; sessions in KV with expiry
- Password reset bumps session version, clears tracked sessions, and revokes API keys
- Auth, support, and ingest rate-limited (Workers Rate Limiting)
- Ingest body size caps (256KB JSON / 12MB multipart)
- Origin allowlist when configured (Origin or Referer required; curl without either is denied)
- `_next` / `_redirect` restricted to allowlisted origins (or `APP_ORIGIN`)
- Image files require a read token (`?t=`) or owner session; magic-byte checked on upload
- Email verification required to create/change projects, billing, and API keys
- API keys cannot create/revoke keys or open Stripe billing (browser session required)
- Form notification emails go only to the account owner (not arbitrary addresses)
- Honeypot fields silently accept spam bots
- Optional Cloudflare Turnstile (fails closed when enabled on a project)
- Edge spam scoring on form (and log) payloads; spam is kept for review but does not burn monthly quota
- Production `SPAM_FAIL_MODE=fail-closed` treats spam-API outages as spam
- Log dedupe to reduce noise and quota abuse
- Do not collect payment cards or regulated health data without a lawful basis

Report issues via [`.well-known/security.txt`](../.well-known/security.txt). See also the in-app **Legal** tab.
