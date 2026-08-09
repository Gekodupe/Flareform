# Flareform

Open-source **Formspree alternative**: form endpoints, error logs, image uploads, inbox, and analytics.

- **Live:** [https://flareform.pages.dev](https://flareform.pages.dev)
- **API:** [https://flareform-api.nic-58f.workers.dev](https://flareform-api.nic-58f.workers.dev)

## Local UI

```bash
npm install
npm run serve
```

Deploy UI to Cloudflare Pages:

```bash
npm run pages:deploy
```

API (sibling package):

```bash
cd ../../FlareformAPI
npm install
npm run deploy
```

## Docs

In the app: **Docs** and **API** tabs (Docsify). Or open `docs/index.html`.

## License

MIT. See [LICENSE](./LICENSE).
