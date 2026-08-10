# Flareform

**Open-source Formspree alternative** - form endpoints, error logs, inbox, email notify, and analytics on Cloudflare.

## What you get

| Feature | Description |
|---------|-------------|
| Form endpoints | `POST /f/{projectId}` - HTML forms or JSON |
| Error logs | `POST /l/{projectId}` - errors and warnings, deduped |
| Images | Multipart image uploads (separate monthly quota) |
| Inbox & logs | Filter by project, sort, detail, CSV/JSON export |
| API keys | Generate `ff_live_…` keys on the API tab |
| Email notify | Brevo transactional mail on new form submissions |
| Billing | Free / Starter / Pro via Stripe |

## Repositories

- Frontend: [Gekodupe/Flareform](https://github.com/Gekodupe/Flareform)
- API Worker: [Gekodupe/FlareformAPI](https://github.com/Gekodupe/FlareformAPI)

## Next

- [Quick start](quickstart.md)
- [API reference](api.md)
- [Self-host](self-host.md)
- [Forms & email](forms.md)
- [Logs](logs.md)
- [Images](images.md)
- [Plans](plans.md)
- [Errors](errors.md)
- [Security](security.md)
