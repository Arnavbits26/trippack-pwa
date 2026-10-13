# TripPack: an offline-first trip planner (installable PWA)

TripPack lets you plan a trip day by day (activities with times and types, a packing checklist),
and it keeps working with no network. It can be installed on a phone or laptop from the browser.

Built with **React 18, TypeScript, Redux Toolkit and Vite**. The **service worker is hand-written**
(no Workbox or PWA plugin) so every caching decision is visible in `src/sw.template.js`.

## Features

- Create trips (name, destination, start date, 1 to 14 days) and open them by URL (`#/trip/<id>`)
- Add, tick off and delete activities, kept sorted by day and time; search them and filter by type
- Packing checklist per trip
- Works fully offline, including opening a trip deep link with the network off
- Installable (web manifest with 192, 512 and maskable icons, plus an in-app "Install app" button)
- Offline banner announced to screen readers; light and dark themes; keyboard friendly; no horizontal
  scrolling at 360px wide

## How it works

| Part | What it does |
|---|---|
| `src/store/` | Redux Toolkit slice for trips, activities and packing; selectors for filtering; defensive `localStorage` persistence (corrupt or missing data is ignored, never crashes the app) |
| `src/sw.template.js` | Service worker: precaches the app shell on install, serves it cache-first (so pages load instantly and offline), cleans up old caches on activate |
| `vite.config.ts` | A small build plugin that emits `dist/sw.js`, injecting the list of built files and a content hash, so every release installs a fresh worker and drops the old cache |
| `src/App.tsx` | Hash routing; the trip screen is lazy-loaded so the first screen stays small |
| `public/manifest.webmanifest` | Name, icons, `standalone` display, scope and start URL relative to the install path, so it also works under a sub-path such as GitHub Pages |

## Run it

```bash
cd ~/Desktop/trippack-pwa
npm install
npm run dev          # development (the service worker is only registered in production builds)
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build at http://localhost:4173
```

## Test it

```bash
npm test                              # 14 unit tests (Vitest): reducers, selectors, persistence
npx playwright install chromium       # first time only
npm run test:e2e -- --project=chromium  # 11 end-to-end tests against the production build
npm run lighthouse                    # Lighthouse, 3 runs each for mobile and desktop
```

The end-to-end tests cover: creating and validating trips, sorted activities and filtering, persistence
across reloads, keyboard-only use, no horizontal overflow on a small phone, manifest and icon checks,
service worker install and precache contents, Chromium's own installability check
(`Page.getInstallabilityErrors` returns no errors), and offline behaviour (reload offline, open a deep
link offline, add data offline, banner appears and disappears).

## Results

Measured on the production build served locally (`vite preview`):

| Check | Result |
|---|---|
| Unit tests | 14 / 14 pass |
| End-to-end tests (Chromium) | 11 / 11 pass |
| Lighthouse, mobile (median of 3) | Performance 99, Accessibility 100, Best Practices 100, SEO 100 |
| Lighthouse, desktop (median of 3) | 100 / 100 / 100 / 100 |
| Mobile metrics (median) | First Contentful Paint 1.35 s, Largest Contentful Paint 1.48 s, Total Blocking Time 131 ms, Layout Shift 0.012 |
| Bundle | Main JavaScript about 58 kB gzipped; trip screen loaded as a separate lazy chunk |

Mobile performance varied between 97 and 99 across the runs made while building this. Raw numbers are
in `results/lighthouse-summary.json` and `results/e2e-results.json`.

I also checked that the service-worker tests are not vacuous: with service worker registration switched
off, the three service-worker tests fail (and the manifest test still passes, as it should).

## Limitations

- The browser tests were run on **Chromium only**. `playwright.config.ts` also defines Firefox and WebKit
  projects, but they have not been run; run `npx playwright install firefox webkit` and then
  `npm run test:e2e` to try them. Real-device testing (especially iOS Safari, where installing is a manual
  "Add to Home Screen") has not been done.
- Lighthouse ran against a local server with its simulated throttling, not a deployed site on a real network.
- Data lives in `localStorage` on one device (roughly 5 MB, no sync between devices, no accounts).
  There is no backend, push notification or background sync.
- Recent Lighthouse versions no longer have a PWA score, so installability is checked with Chromium's
  DevTools installability errors instead.
