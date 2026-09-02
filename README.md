# Proglog

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Static Site](https://img.shields.io/badge/Type-Static%20Site-7c5cff)](https://github.com)
[![Firebase Ready](https://img.shields.io/badge/Firebase-Ready-ffca28)](https://firebase.google.com)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-00c2a8)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

A sleek gaming tracker for managing your game library, trophies, sessions, profile, and progress.

Proglog helps players keep momentum across their backlog, track time spent playing, and surface the information they actually care about in a clean, app-like experience.

## 📸 Site preview

<p align="center">
  <img src="https://via.placeholder.com/1200x700?text=Proglog+Preview" alt="Proglog app preview" width="100%" />
</p>

## ✨ Highlights

- Responsive desktop, tablet, and mobile interface
- Personalized profile themes with accent colors
- Trophy tracking, guides, and catalog browsing
- Fast game and trophy search with keyboard shortcuts
- Sessions, friends, stats, and activity monitoring
- Offline-ready local storage with optional Firebase sync
- PWA / offline fallback support
- PlayStation and Steam catalog support without platform lock-in

## Run locally

## 🧭 Project overview

Proglog is a static web application designed to feel like a modern gaming dashboard. It brings together:

- game discovery and library tracking
- trophy progress and completion data
- play session summaries and activity history
- profile customization and preferences
- social features for friends and comparing progress

## 🚀 Run locally

Serve the project with any static web server:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500/
```

## 🧪 Validate

```bash
npm run validate
```

## 🌐 Deploy

The app is structured for GitHub Pages or any static hosting provider. Firebase is optional and only used for cloud persistence features.

## 📁 Structure

- `pages/` — grouped page templates for core, games, user, social, activity, and legal views
- `assets/` — CSS, JavaScript, and media assets
- `scripts/` — validation and automation scripts
- `index.html` — main app entry point
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker for offline support

## 💡 Why it stands out

Proglog is designed to feel lightweight and personal while still supporting richer game-tracking workflows. Its structure keeps the app fast, easy to navigate, and flexible for future upgrades without requiring a heavy framework.

## Community feeds

The landing page now includes larger Reddit, YouTube, and Twitch sections with refresh controls.

- Reddit: public `r/gaming` JSON feed.
- YouTube: public channel RSS feeds aggregated without a browser API key.
- Twitch: uses the Firebase Function `twitchStreams` so OAuth credentials never reach the browser.

For Twitch, configure `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` as Firebase Functions environment variables/secrets before deployment. The frontend calls `/api/twitchStreams` automatically when deployed through Firebase Hosting.

## Reliable external feeds

ProgLog now uses Firebase Functions as a proxy for TheGamesDB, Reddit, and YouTube. This avoids common browser CORS/rate-limit failures and adds retries, timeouts, caching, and image fallbacks.

For production Firebase deployment, configure the server-side TheGamesDB key and Twitch credentials:

```bash
firebase functions:secrets:set TheGamesDB_API_KEY
firebase functions:secrets:set TWITCH_CLIENT_ID
firebase functions:secrets:set TWITCH_CLIENT_SECRET
firebase deploy --only functions,hosting
```

The browser retains the TheGamesDB key as a fallback for local/static hosting. For the most secure production setup, remove the fallback key from `assets/js/tgdb-config.js` after confirming the `/api/tgdb` function is deployed.


## Game data sources
- TheGamesDB: primary game metadata, artwork, platform and store information.
- RAWG: achievements, screenshots and YouTube game videos/guides.
- Configure `THEGAMESDB_API_KEY` and `RAWG_API_KEY` as Firebase Functions secrets before deployment.
