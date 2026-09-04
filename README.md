# progLog

progLog is a personal gaming journal and library tracker. The current build is designed around one idea: **every game leaves a story — keep yours.**

## Product direction

- Personal library with Playing / Backlog / Completed / Dropped / Wishlist states
- Manual playtime and session logging
- Achievement tracking from catalogue data
- Ratings and reviews
- Signature Journey timeline
- Pixel avatar creator with editable colors
- RAWG-powered game discovery through the Cloudflare Worker
- Firebase Authentication + Firestore persistence
- Optional Steam integration; Steam is not required for the core product
- CSV library import
- Friends, activity, wishlist, stats, trophies and notifications
- Dark / light mode with persistent preference
- Cookie/storage consent notice
- Responsive navigation and mobile layout
- PWA shell, SEO metadata, sitemap and robots.txt

## First run

1. Fill in `assets/js/firebase-config.js` with the Firebase Web App configuration.
2. Deploy the Worker in `worker/` and set `RAWG_API_KEY` as a Cloudflare Worker secret.
3. Put the deployed Worker URL in `assets/js/api-config.js`.
4. Enable Firebase Authentication providers you want to use.
5. For the demo profile, enable Anonymous Authentication if you want the demo account to use Firebase; the UI also has a local demo fallback.
6. Deploy `dist/` to GitHub Pages or another static host.

## Design principles

The interface deliberately uses pixel art as a personality layer rather than turning every component into a retro game UI. Game artwork is the content layer, lavender/indigo is used for interaction, gold is reserved for rewards and progress, and neutral surfaces carry the layout.
