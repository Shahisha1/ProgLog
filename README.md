# progLog

Personal gaming tracker built for GitHub Pages.

## Stack

- GitHub Pages: frontend hosting
- Firebase Authentication + Firestore: accounts and user data
- Cloudflare Worker: secure RAWG + Steam API proxy
- RAWG: game discovery, metadata, screenshots and available achievements
- Steam Web API: profile, owned games, recent games and achievement sync

## Setup

1. Put the repository contents on GitHub Pages.
2. Add your Firebase Web App config to `assets/js/firebase-config.js`. Do not commit private credentials other than the public web config values Firebase expects.
3. In `worker/`, add `RAWG_API_KEY` and `STEAM_API_KEY` as Worker Secrets and deploy.
4. Put the resulting Worker URL in `assets/js/api-config.js`.
5. Configure Firebase Authentication (Email/Password and Google) and publish `firestore.rules`/`firestore.indexes.json`.

The app does not use Firebase Storage. Game artwork is referenced from RAWG URLs; API keys live in Cloudflare Worker Secrets.
