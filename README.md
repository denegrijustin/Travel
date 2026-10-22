# Travel

Personal trip planner, deployed as the `italy` Cloudflare Worker (italy.elskatemm.com). A static single-page app in `public/` plus a small Worker (`src/worker.js`) for sync and share links.

## What it does
- **Trips**: the built-in Italy 2027 sailing trip, and trips you create (name, first day, number of days; each day has a title, notes, places and an optional photo link).
- **Itinerary**: day cards with photos, sailing distance and time at your cruising speed, weather (forecast within two weeks, otherwise what that date was like last year), your own time-by-time plan for each day, and the reservations that fall on that day.
- **Map**: the route by day on OpenStreetMap, with pins that open Google Maps or Apple Maps, plus your saved places as stars.
- **Reservations, saved places, packing list, expenses (EUR and USD, categories, per-day totals), documents, notes.**
- **Share and export**: print, calendar file (.ics), a read-only share link, a JSON backup.
- **Sync across devices**: a passphrase becomes a key (its SHA-256); data is stored in KV under that key and merged section by section (latest edit of a section wins). Anyone who knows the passphrase can read the data.
- **Offline and installable**: a service worker caches the app, photos and the map tiles you have looked at.

## Files
- `public/index.html`, `app.css`, `app.js`: the app. `lib.js`: pure helpers shared with the Worker and tests. `data.js`: the Italy trip, its approximate coordinates and photo credits. `sw.js`, `manifest.webmanifest`, `icons/`.
- `src/worker.js`: `/api/sync/:key` (GET, PUT with server-side merge) and `/api/share` (POST, GET), backed by the `SYNC` KV namespace. Everything else is served from `public/`.
- `wrangler.jsonc`: Worker name `italy` (must match the Cloudflare project), the assets folder, and the KV binding. `run_worker_first` is `true` (not a path list) so older Wrangler versions, which Workers Builds may use, accept the file; the Worker passes non-API requests straight to the assets.

## Develop
```
npm test                       # unit tests (node:test, no dependencies)
node test/dev-server.mjs 4196  # preview at http://127.0.0.1:4196 with an in-memory KV store
```

## Notes
- Photos are from Wikimedia Commons; each card links to its credit.
- Map tiles are OpenStreetMap's public tile server (light personal use). Place search uses OpenStreetMap's Nominatim, one request at a time.
- KV free tier allows 1,000 writes a day; the app writes only when something changed.
