# Errors

| Status | Meaning |
|--------|---------|
| 400 | Bad body, empty submission, invalid log level |
| 401 | Sign in required |
| 403 | Origin blocked, Turnstile failed, logs disabled, plan limit |
| 404 | Unknown project / submission |
| 413 | Image too large |
| 429 | Submission or image quota reached |
| 500 | Internal error |

Ingest always returns JSON unless an HTML form redirect (`_next`) succeeds with `303`.
