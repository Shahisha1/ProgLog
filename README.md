# progLog

A framework-free gaming tracker using the original GameTrack dark navy/purple visual design.

## Architecture

- **GitHub Pages** — static frontend hosting
- **Firebase Authentication** — email/password + Google sign-in
- **Cloud Firestore** — profiles, saved games, sessions and contact messages
- **Cloudflare Worker** — secure server-side proxy for the RAWG API
- **RAWG** — game search, metadata, artwork URLs, screenshots and available achievement data
- **Firebase Storage** — not used for game artwork

The RAWG key must never be committed to GitHub, put in `app.js`, or stored in Firestore. Cloudflare Worker Secrets are designed for API keys and auth tokens. See the Cloudflare documentation: https://developers.cloudflare.com/workers/configuration/secrets/

## Project structure

```text
progLog/
├── index.html
├── pages/
│   ├── games.html
│   ├── game.html
│   ├── achievements.html
│   ├── trophies.html
│   ├── sessions.html
│   ├── friends.html
│   ├── profile.html
│   ├── settings.html
│   ├── auth.html
│   └── contact.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   ├── firebase.js
│   │   ├── firebase-config.js
│   │   └── api-config.js
│   └── images/
│       ├── favicon.svg
│       ├── social-share.svg
│       └── UI artwork
├── worker/
│   ├── src/index.js
│   ├── wrangler.jsonc
│   ├── .gitignore
│   └── README.md
├── firestore.rules
├── firestore.indexes.json
├── .firebaserc
└── .nojekyll
```

## 1. Set up RAWG

Create a RAWG API key from the RAWG developer/API area. Do not paste the key into this repository.

## 2. Deploy the Cloudflare Worker

Open a terminal in `worker/`:

```bash
npm install -g wrangler
wrangler login
wrangler secret put RAWG_API_KEY
wrangler deploy
```

When prompted for `RAWG_API_KEY`, paste your key. Cloudflare stores it as a secret instead of plaintext Worker configuration.

Copy the Worker URL, then edit:

```text
assets/js/api-config.js
```

and replace:

```js
export const API_BASE = 'https://YOUR-PROGLOG-RAWG-WORKER.workers.dev';
```

with your real Worker URL.

Test it in a browser:

```text
https://YOUR-WORKER.workers.dev/health
https://YOUR-WORKER.workers.dev/games?search=elden%20ring
```

## 3. Firebase

Firebase is still used for Authentication and Firestore; Firebase Storage is not required.

In Firebase project `proglog-fa459`:

1. Create/register the Firebase Web App.
2. Enable Authentication → Email/Password.
3. Enable Authentication → Google and add your GitHub Pages domain to Authorized domains.
4. Create Firestore.
5. Publish `firestore.rules`.
6. Put the Web App config in `assets/js/firebase-config.js` for local/GitHub Pages use.

The Web App config is client-side configuration. Never put Firebase service-account private keys in the repository.

## 4. GitHub Pages

Push the repository to GitHub and enable **Settings → Pages** using the branch/folder containing `index.html`.

Because the project uses relative paths, it works with both a user/organization Pages site and a repository Pages site.

Enable HTTPS in GitHub Pages. GitHub Pages supports HTTPS for Pages sites. See: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

## RAWG features now wired into progLog

On **Games**:

- Search RAWG
- Display matching games
- Add a game to the user's library
- Save RAWG ID and game metadata to Firestore when authenticated
- Keep a local cache for offline/demo use

On **Game Details**:

- Load game by RAWG ID
- Hero artwork
- Cover artwork
- Rating and ratings count
- Platforms
- Genres
- Release date
- Description
- Screenshots
- Available RAWG achievement data
- Save game to library

The same saved game object is designed to be reused by the profile, sessions, achievements and trophy views.

## Recommended next development phases

### Phase 1 — RAWG + library (implemented)

Game search/import, game detail metadata, artwork URLs and Firestore library records.

### Phase 2 — Real user data (next)

Replace demo content on profile, sessions, achievements and trophies with Firestore reads/writes. Add session creation/edit/delete and per-game completion statistics.

### Phase 3 — Platform achievement sync

Keep RAWG as the game catalogue, then add platform-specific sources. For example, Steam can be integrated server-side so users can optionally sync their Steam achievements without exposing platform API credentials.

### Phase 4 — Friends/social

Add friend requests, profiles, activity visibility and recent activity using Firestore rules that prevent users from changing other users' private data.

### Phase 5 — Production hardening

Add Cloudflare rate limiting, API caching, better error states, loading skeletons, image fallbacks, Firestore indexes, analytics/monitoring and a production privacy policy.
