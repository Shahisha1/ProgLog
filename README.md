# progLog

<div align="center">

## Every game leaves a story. Keep yours.

A personal gaming journal, library, achievement tracker, and gaming history — built for people who want to remember more than just what they own.

<br>

[![GitHub](https://img.shields.io/badge/GitHub-View%20Repository-181717?style=for-the-badge&logo=github)](https://github.com/Shahisha1/ProgLog)
[![Stars](https://img.shields.io/github/stars/Shahisha1/ProgLog?style=for-the-badge&logo=github)](https://github.com/Shahisha1/ProgLog/stargazers)
[![Issues](https://img.shields.io/github/issues/Shahisha1/ProgLog?style=for-the-badge)](https://github.com/Shahisha1/ProgLog/issues)
[![Last Commit](https://img.shields.io/github/last-commit/Shahisha1/ProgLog?style=for-the-badge)](https://github.com/Shahisha1/ProgLog/commits/main)

<br>

**Discover. Track. Play. Remember.**

</div>

---

## The idea

Most gaming platforms answer one question:

> **"What games do you own?"**

progLog asks something different:

> **"What did you actually experience?"**

Your games are more than entries in a library.

They're hours spent playing late at night.
They're achievements you spent way too long unlocking.
They're games you abandoned halfway through.
They're games you somehow keep returning to.
They're the backlog that never seems to disappear.

**progLog turns all of that into a story.**

---

<div align="center">

### Your gaming life, in one place.

```text
                           DISCOVER
                              |
                              v
                        +-----------+
                        |  LIBRARY  |
                        +-----+-----+
                              |
               +--------------+--------------+
               |              |              |
               v              v              v
           SESSIONS      ACHIEVEMENTS     WISHLIST
               |              |              |
               +--------------+--------------+
                              |
                              v
                       YOUR JOURNEY
```

</div>

---

# What makes progLog different?

progLog isn't designed to be another game launcher.

It's designed to be the **memory layer on top of your gaming life**.

| Your games | Your progress | Your story     |
| ---------- | ------------- | -------------- |
| Library    | Achievements  | Gaming Journey |
| Backlog    | Playtime      | Activity       |
| Wishlist   | Sessions      | Reviews        |
| Discovery  | Statistics    | Profile        |

Everything connects.

A game enters your library.

You play it.

Your sessions build your playtime.

Your achievements build your profile.

Your activity becomes part of your Journey.

**One game can become an entire chapter.**

---

# Explore your library

## Your games. Your rules.

Build a personal collection and organize games however you actually play them.

### Statuses

```text
PLAYING
BACKLOG
COMPLETED
DROPPED
WISHLIST
```

And because a game isn't just a database entry, you can also keep your own:

- Ratings
- Reviews
- Playtime
- Notes
- Game metadata
- Artwork

Your library becomes a record of your gaming history rather than a simple list.

---

# Discover your next game

## Powered by RAWG

progLog connects with the RAWG game catalogue to bring rich game information directly into the experience.

Discover:

- Artwork
- Screenshots
- Release dates
- Genres
- Platforms
- Ratings
- Descriptions
- Achievements
- Related game information

Find something interesting?

**Add it directly to your library.**

---

# Track every hour

## Gaming Sessions

Sometimes the most interesting statistic isn't how many games you own.

It's how much time you spent playing them.

Log individual sessions with:

```text
Game
Duration
Date
Notes
```

progLog turns those sessions into useful statistics:

- Total playtime
- Session history
- Gaming activity
- Gaming streaks
- Per-game playtime

Because eventually you'll want to know where those 300 hours went.

---

# Chase completion

## Achievements

Track your progress across the games you play.

progLog supports:

- Unlocked achievements
- Achievement progress
- Completion percentage
- Rare achievements
- Achievement milestones
- Trophy tiers

Your achievement progress contributes to your overall gaming profile.

Over time, your profile becomes a record of what you've accomplished.

---

# See the bigger picture

## Gaming Journey

This is where everything comes together.

Your **Journey** transforms your gaming activity into a chronological timeline.

```text
2024
 |
 +-- Added Elden Ring
 +-- Logged 12 sessions
 +-- Unlocked 18 achievements
 |
2025
 |
 +-- Started Cyberpunk 2077
 +-- Completed Hades
 +-- Rated Red Dead Redemption 2
 |
2026
 |
 +-- Currently playing...
```

Your library tells you **what** you played.

Your statistics tell you **how much** you played.

Your Journey tells you **when it happened**.

### Your gaming history becomes something you can actually look back on.

---

# Build your identity

## Pixel Avatars

Your profile shouldn't look like everyone else's.

Create your own pixel-art identity and customize:

| Customization | Options                    |
| ------------- | -------------------------- |
| Character     | Choose your base character |
| Skin          | Customize appearance       |
| Hair          | Choose your style          |
| Outfit        | Build your look            |
| Accent        | Set your visual identity   |
| Background    | Finish your profile        |

Your avatar appears throughout your profile and dashboard.

---

# Turn your gaming into statistics

## Gaming Statistics

progLog transforms your activity into a personal gaming dashboard.

Track:

- Total games
- Total playtime
- Completed games
- Games in progress
- Backlog size
- Achievement completion
- Most-played games
- Favourite genres
- Gaming streaks
- Session history

The goal isn't to bury you in numbers.

It's to help you understand **how you actually play**.

---

# Don't game alone

## Friends & Activity

Connect with other progLog users and keep up with what they're doing.

See:

- Friend activity
- Recently played games
- Achievement unlocks
- Completed games
- Wishlist additions
- Public profiles

Your gaming profile can become more than a private collection.

It can become something you share.

---

# Never lose track of what's next

## Wishlist & Releases

Keep track of the games you're waiting for.

Monitor:

- Wishlist games
- Upcoming releases
- Release dates
- Games you're watching

Your backlog may be impossible to defeat.

At least now it has a system.

---

# Already have a collection?

## CSV Library Import

Starting from zero shouldn't be necessary.

Import an existing collection using CSV.

```csv
Game,Status,Playtime,Rating
Elden Ring,Playing,94,5
Hades,Completed,48,5
Cyberpunk 2077,Playing,67,4
```

Bring your existing library into progLog and continue from there.

---

# Your profile

Everything comes together inside your personal gaming profile.

```text
+------------------------------------------------+
|                  YOUR PROFILE                  |
+------------------------------------------------+
|                                                |
|              Pixel Avatar                     |
|                                                |
|        Games        Playtime       Achievements|
|         128           742h              634    |
|                                                |
+------------------------------------------------+
|                                                |
|  Currently Playing                             |
|  Backlog                                      |
|  Recent Achievements                           |
|  Gaming Activity                               |
|                                                |
+------------------------------------------------+
```

Your profile combines your library, statistics, achievements, activity, avatar, and gaming history into one place.

---

# Authentication

progLog uses **Firebase Authentication**.

Supported authentication includes:

- Email and password
- Google Sign-In
- Demo profile

Authenticated users have access to their own protected gaming data.

---

# Data architecture

Personal data is stored using **Cloud Firestore**.

```text
User
 |
 +-- Profile
 +-- Avatar
 +-- Games
 +-- Sessions
 +-- Achievements
 +-- Friends
 +-- Wishlist
 +-- Activity
 +-- Notifications
 +-- Settings
```

Firestore security rules are included with the project.

---

# Architecture

progLog keeps the frontend lightweight while separating external API access from the client.

```text
                         +--------------+
                         |     RAWG     |
                         | Game Catalog |
                         +------+-------+
                                |
                                v
+-------------+          +--------------+
|   Browser   | -------> |  Cloudflare  |
|  progLog UI |          |    Worker    |
+------+------+          +------+-------+
       |                        |
       |                        v
       |                     RAWG API
       |
       v
+------------------------------+
|           Firebase           |
|                              |
| Authentication + Firestore   |
+------------------------------+
```

### Technology Stack

| Technology              | Purpose                     |
| ----------------------- | --------------------------- |
| HTML                    | Application structure       |
| CSS                     | UI and responsive design    |
| JavaScript              | Application logic           |
| Firebase Authentication | User authentication         |
| Cloud Firestore         | Persistent user data        |
| RAWG                    | Game catalogue and metadata |
| Cloudflare Workers      | API proxy                   |
| Lucide                  | Interface icons             |

---

# Design philosophy

progLog deliberately avoids the typical generic dashboard aesthetic.

The visual system is built around a few ideas:

### Pixel art

Personality and identity.

### Game artwork

The games remain the focus.

### Purple / Iris

Interaction and navigation.

### Gold / Amber

Achievements, trophies, and rewards.

### Dark neutrals

Structure and readability.

The result should feel like:

> **A gaming product first. A dashboard second.**

---

# Themes

progLog supports both dark and light themes.

## Dark Mode

A deep, low-distraction interface designed for long gaming sessions.

## Light Mode

A warmer, paper-inspired interface with carefully adjusted contrast rather than simply reversing the dark theme.

Theme preferences are saved locally.

---

# Responsive by design

progLog is designed to work across:

```text
Desktop
   |
Laptop
   |
Tablet
   |
Mobile
```

Navigation and layouts adapt automatically to smaller screens.

---

# Privacy & Storage

progLog includes a lightweight consent banner for browser storage.

Local browser storage may be used for:

- Theme preference
- Cookie/storage consent
- Offline shell caching
- Local UI preferences

Account-specific information is stored through Firebase.

See:

- `Privacy Policy`
- `Terms of Service`

---

# Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/Shahisha1/ProgLog.git
cd ProgLog
```

## 2. Configure Firebase

Create a Firebase project and enable:

- Authentication
- Email/Password
- Google Sign-In
- Firestore

Then add your Firebase Web App configuration to:

```text
assets/js/firebase-config.js
```

Example:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

Firebase Web configuration values are intended for client applications.

**Never expose administrative credentials or server-side secrets.**

---

# RAWG API

progLog uses RAWG for game discovery and metadata.

The RAWG API key should **never be committed to the repository**.

Instead, configure it through the Cloudflare Worker.

The frontend communicates with the Worker rather than exposing the RAWG secret directly.

---

# Cloudflare Worker

The API proxy is located at:

```text
worker/
├── src/
│   └── index.js
├── wrangler.jsonc
└── README.md
```

### Install Wrangler

```bash
npm install -g wrangler
```

### Login

```bash
npx wrangler login
```

### Add the RAWG secret

```bash
npx wrangler secret put RAWG_API_KEY
```

### Deploy

```bash
npx wrangler deploy
```

After deployment, update:

```text
assets/js/api-config.js
```

with your Worker URL.

---

# Steam Integration

Steam is **optional**.

The core progLog experience does not depend on Steam.

Without Steam, users can still:

- Add games
- Track playtime
- Log sessions
- Track achievements
- Rate games
- Write reviews
- Manage their backlog
- Manage their wishlist
- Build their Journey
- View statistics

Steam can be connected independently without changing the core library system.

---

# Demo Profile

Want to explore progLog before building your own library?

Use the built-in demo profile.

The demo does **not** automatically appear. Users must explicitly select:

```text
Enter Demo Profile
```

The demo contains example:

- Games
- Playtime
- Achievements
- Sessions
- Activity
- Wishlist items
- Friends
- Statistics

It's a fully populated example environment for exploring the application.

---

# Project Structure

```text
ProgLog/
|
├── index.html
├── overview.html
|
├── pages/
│   ├── games.html
│   ├── game.html
│   ├── achievements.html
│   ├── trophies.html
│   ├── sessions.html
│   ├── friends.html
│   ├── journey.html
│   ├── wishlist.html
│   ├── stats.html
│   ├── compare.html
│   ├── notifications.html
│   ├── profile.html
│   ├── settings.html
│   ├── auth.html
│   ├── contact.html
│   ├── privacy.html
│   ├── terms.html
│   └── thank-you.html
|
├── assets/
│   ├── css/
│   │   └── styles.css
│   |
│   ├── images/
│   |
│   └── js/
│       ├── app.js
│       ├── firebase.js
│       ├── firebase-config.js
│       ├── api-config.js
│       |
│       └── modules/
│           ├── core.js
│           ├── api.js
│           ├── store.js
│           ├── ui.js
│           ├── home.js
│           ├── games.js
│           ├── achievements.js
│           ├── sessions.js
│           ├── trophies.js
│           ├── friends.js
│           ├── profile.js
│           ├── settings.js
│           ├── wishlist.js
│           ├── compare.js
│           ├── journey.js
│           ├── notifications.js
│           └── auth-ui.js
|
├── worker/
│   ├── src/
│   │   └── index.js
│   ├── wrangler.jsonc
│   └── README.md
|
├── firestore.rules
├── firestore.indexes.json
├── site.webmanifest
├── sw.js
├── sitemap.xml
├── robots.txt
└── README.md
```

---

# Security

Never commit:

```text
.env
service-account.json
RAWG_API_KEY
STEAM_API_KEY
Firebase Admin credentials
```

API secrets belong in the Cloudflare Worker environment.

Firestore security rules are included to restrict access to user-owned data.

> Never place Firebase Admin credentials, service-account keys, RAWG secrets, Steam secrets, or other privileged credentials inside client-side JavaScript.

---

# Deployment

progLog can be deployed using:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Firebase Hosting

The API proxy can run independently through Cloudflare Workers.

### Recommended setup

```text
                         STATIC HOST
                              |
                              v
                       PROGLOG FRONTEND
                              |
                              v
                       CLOUDFLARE WORKER
                              |
                              v
                           RAWG API


                           FIREBASE
                          /        \
                         v          v
                AUTHENTICATION   FIRESTORE
```

---

# Roadmap

## Completed

- Firebase authentication
- Firestore persistence
- Game discovery
- Game library
- Game statuses
- Sessions
- Achievements
- Ratings and reviews
- Wishlist
- Friends
- Activity
- Notifications
- Statistics
- Gaming Journey
- Pixel avatars
- Avatar customization
- Dark / light mode
- Responsive UI
- PWA support
- CSV library import
- Optional Steam integration

## Future

- More avatar items
- Unlockable cosmetics
- XP and player levels
- Achievement-based rewards
- More platform integrations
- Advanced gaming analytics
- Social profiles
- Community challenges
- Shareable gaming profiles
- Public Journey pages

---

# Contributing

Found something broken?

Have an idea?

Want to make progLog better?

Contributions are welcome.

### 1. Fork the repository

### 2. Create a branch

```bash
git checkout -b feature/my-feature
```

### 3. Make your changes

### 4. Test everything

### 5. Commit

```bash
git commit -m "Add my feature"
```

### 6. Push

```bash
git push origin feature/my-feature
```

### 7. Open a Pull Request

Keep contributions focused, tested, and consistent with the existing architecture and design language.

---

# Reporting Issues

When opening an issue, include:

- What happened
- What you expected
- Steps to reproduce
- Browser
- Device
- Console errors
- Screenshots when useful

The more information provided, the easier it is to reproduce and fix the issue.

---

# License

This project is currently provided for **educational and personal use**.

See the repository for the applicable license and third-party service terms.
