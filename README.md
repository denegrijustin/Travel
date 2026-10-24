# Travel

Personal trip planner, deployed as the `italy` Cloudflare Worker (italy.elskatemm.com). A static single-page app in `public/` plus a small Worker (`src/worker.js`) for sync and share links.

## What it does
- **Trips**: the built-in Italy 2027 sailing trip, and trips you create (name, first day, number of days; each day has a title, notes, places and an optional photo link).
- **Itinerary**: day cards with photos, sailing distance and time at your cruising speed, weather (forecast within two weeks, otherwise what that date was like last year), your own time-by-time plan for each day, and the reservations that fall on that day.
- **Map**: the whole trip drawn as one connected route (a colour per day, direction arrows, dashed links between days), with animated zooming between days and places, a satellite layer, and a card for the place you pick. **Play trip** sails a boat along the route, stopping at each place, with a progress scrubber and 1×/2×/4× speed (reduced-motion settings step from place to place instead). Your saved places show as stars.
- **Place guides**: a written history, what to see and tips for each Italy stop (`public/places.js`), plus a live summary and photo from Wikipedia for any place, including the stops of trips you create. Every stop chip links to its guide; you can keep notes on each place.
- **Reservations, saved places, packing list, expenses (EUR and USD, categories, per-day totals), documents, notes.**
- **Share and export**: print, calendar file (.ics), a read-only share link, a JSON backup.
- **Sync across devices**: a passphrase becomes a key (its SHA-256); data is stored in KV under that key and merged section by section (latest edit of a section wins). Anyone who knows the passphrase can read the data.
- **Offline and installable**: a service worker caches the app, photos and the map tiles you have looked at.

## Files
- `public/index.html`, `app.css`, `app.js`: the app. `map.js`: the trip map and tour. `places.js`: the place guides. `lib.js`: pure helpers (including the tour path maths) shared with the Worker and tests. `data.js`: the Italy trip, its approximate coordinates and photo credits. `sw.js`, `manifest.webmanifest`, `icons/`.
- `src/worker.js`: `/api/sync/:key` (GET, PUT with server-side merge) and `/api/share` (POST, GET), backed by the `SYNC` KV namespace. Everything else is served from `public/`.
- `wrangler.jsonc`: Worker name `italy` (must match the Cloudflare project), the assets folder, and the KV binding. `run_worker_first` is `true` (not a path list) so older Wrangler versions, which Workers Builds may use, accept the file; the Worker passes non-API requests straight to the assets.

## Develop
```
npm test                       # unit tests (node:test, no dependencies)
node test/dev-server.mjs 4196  # preview at http://127.0.0.1:4196 with an in-memory KV store
```

## Notes
- Photos are from Wikimedia Commons; each card links to its credit.
- Map tiles are OpenStreetMap's public tile server (light personal use); the satellite layer is Esri World Imagery. Place search uses OpenStreetMap's Nominatim, one request at a time.
- KV free tier allows 1,000 writes a day; the app writes only when something changed.

## Getting there and back

The Italy 2027 trip includes the flights (Kansas City → Toronto → Naples, Rome → Philadelphia → Kansas City) and the trains (Naples → Salerno, Salerno → Rome), plus a day and a half in Rome. They are defined in `ITALY_EXTRA` in `public/data.js`; the dates are assumptions to adjust there. The map's **Show flights** button draws the flights as great-circle arcs, and the tour marker becomes a train on rail days.
