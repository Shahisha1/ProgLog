# progLog API Worker

This Worker is the secure proxy used by the GitHub Pages frontend. Keep API secrets out of the repository. Cloudflare Worker Secrets are the correct place for API keys.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler secret put RAWG_API_KEY
npx wrangler secret put STEAM_API_KEY
npx wrangler deploy
```

Then keep the public Worker URL in `assets/js/api-config.js`.

## Endpoints

- `/health`
- `/games`
- `/games/:id`
- `/games/:id/achievements`
- `/steam/resolve`
- `/steam/player`
- `/steam/owned`
- `/steam/recent`
- `/steam/schema`
- `/steam/achievements`
