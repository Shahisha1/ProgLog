# progLog RAWG proxy

This Cloudflare Worker keeps the RAWG API key off GitHub Pages. The key is stored as a Cloudflare Worker Secret named `RAWG_API_KEY`.

## Deploy

1. Install Node.js and Wrangler: `npm install -g wrangler`
2. Log in: `wrangler login`
3. From this folder run: `wrangler secret put RAWG_API_KEY` and paste your RAWG key when prompted.
4. Deploy: `wrangler deploy`
5. Copy the deployed `https://...workers.dev` URL into `assets/js/api-config.js`.

Endpoints:

- `GET /health`
- `GET /games?search=elden%20ring`
- `GET /games/{rawgId}`

The Worker adds CORS headers for GitHub Pages and caches successful responses. Do not put the RAWG key in the repo, `.js` files, or Firestore.

## Local development

Create `.dev.vars` (never commit it):

```
RAWG_API_KEY=your_key_here
```

Then run `wrangler dev`.
