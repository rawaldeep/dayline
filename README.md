# Dayline — Belgium in a day

A mobile-first, **100% static** web app for the Saturday 7 November 2026 itinerary. Plain HTML, CSS and JavaScript. No server, no build step, no API keys, no accounts. Everything it needs (map library, fonts) ships in `vendor/`.

## Hosting

Upload the **contents** of this folder to any static host.

**GitHub Pages:** push to a repo → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
**Netlify / Cloudflare Pages / any web server:** drag and drop the folder; leave build command empty, publish directory `.`.

All paths are relative, so it also works from a `/repo-name/` subfolder. Locally: `python3 -m http.server 8080`, then open `http://localhost:8080` (GPS and the installable PWA need `http://localhost` or HTTPS, not `file://`).

## What it does

- **Itinerary** with live Brussels clock, countdown to the 21:10 flight, "Up next" card, optional Lier stop, mark-done, and a 20-minute visit timer. Everything is saved on the device.
- **Map** (MapLibre GL, bundled locally) with OpenFreeMap tiles — Streets, Bright or Light — plus a Classic OpenStreetMap raster layer. If the vector style fails to load, it switches to the Classic layer automatically; if both fail it shows a retry button and the address list still works.
- **Exact pins:** on first map visit the app looks up each street address with OpenStreetMap's Nominatim service (one request per second, a handful of addresses) and caches the result in the browser. Until then, and offline, it uses the approximate coordinates in `STOPS`. Results more than 15 km from the expected area are ignored.
- **My location:** optional live GPS dot on the map. Navigation links then start from your position.
- **Directions:** each stop opens Google Maps turn-by-turn using its street address.
- **Flights:** saves your flight numbers and opens them in FlightAware or Flightradar24. There is no live-status backend (that would need a server and an API key). The 08:50 and 21:10 times are your plan, not live data.
- **Checklist**, installable PWA (Add to Home Screen), and an offline app shell after the first visit. Map tiles, geocoding and directions need internet.

## Editing the plan

Edit the `STOPS` array at the top of `app.js` (times are Brussels local time on 2026-11-07). Change a stop's `address` and its pin is re-geocoded automatically; `coords` is only the fallback. The Lier stop uses the *Grote Markt* as a placeholder, so replace its address once you know the real one.

## Files

```
index.html                  Page structure
styles.css                  Responsive styles (bottom tab bar on phones)
app.js                      All app logic
sw.js                       Offline cache (bump CACHE when you change files)
manifest.webmanifest        PWA metadata
assets/icon.svg             App icon
vendor/maplibre-gl.*        MapLibre GL JS 5.5.0 (BSD-3-Clause)
vendor/fonts/*.woff2        Outfit + DM Sans variable fonts (SIL OFL)
```

## Attribution

Keep the on-map attribution: © OpenStreetMap contributors, tiles by OpenFreeMap. Both services are free community resources with no uptime guarantee, and for personal use only light traffic is expected.
