# 🎮 Proglog

> A personal gaming tracker for games, trophies, achievements, stats, and completion progress.

![Status](https://img.shields.io/badge/status-in%20development-F59E0B) ![Frontend](https://img.shields.io/badge/frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-3178C6) ![Auth](https://img.shields.io/badge/auth-Firebase-FFCA28) ![Hosting](https://img.shields.io/badge/hosting-GitHub%20Pages-181717) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🔐 Firebase authentication
- 🎮 Game vault and catalog
- 🏆 Trophy / achievement tracking
- 🔎 Game search and suggestions
- 📊 Stats and completion views
- 👤 Profiles with custom avatars
- 🎨 User-controlled accent themes
- 📱 Responsive UI
- 🧭 Dedicated pages for Overview, Games, Trophies, Sessions, Friends, Stats, Profile, and Settings

## Run locally

Use any static server from the project root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy

Push the repository to GitHub and enable **GitHub Pages** from the repository settings. The root `index.html` is the site entry point.

## Data & integrations

Proglog is designed to use Firebase Authentication + Firestore for cloud accounts and data. Platform trophy/achievement sources should be integrated through their permitted APIs or linked source pages rather than exposing private credentials in the frontend.

## License

MIT.


## Project structure

```text
proglog/
├── index.html
├── 404.html
├── README.md
├── pages/
│   ├── auth/auth.html
│   ├── overview/overview.html
│   ├── games/games.html
│   ├── game/game.html
│   ├── trophies/trophies.html
│   ├── sessions/sessions.html
│   ├── friends/friends.html
│   ├── stats/stats.html
│   ├── profile/profile.html
│   ├── settings/settings.html
│   ├── privacy/privacy.html
│   └── thank-you/thank-you.html
└── assets/
    ├── css/
    └── js/
```
