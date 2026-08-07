# Error logs

Capture client and server errors from your sites.

## Enable

Projects → **Enable error logs** (or toggle on an existing project).

Endpoint:

```text
POST https://flareform-api.nic-58f.workers.dev/l/{projectId}
```

## Payload

```json
{
  "level": "error",
  "message": "Uncaught TypeError: …",
  "stack": "at …",
  "url": "https://yoursite.com/page",
  "userAgent": "…"
}
```

Accepted levels: `error`, `fatal`, `critical`, `warn` (`warning`).

## Deduping & quota

Identical fingerprints are collapsed; `occurrenceCount` increases. First unique event counts toward your **submission** quota; duplicate bumps do not.

## UI

Open the **Error logs** tab to filter by project/level, inspect JSON, mark read, or delete.
