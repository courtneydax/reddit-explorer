# Reddit Explorer

A single-file, no-install Reddit browser. Search any subreddit or user, browse their post history as an image/video gallery, and save favorites — all client-side.

## Usage

1. Download `reddit-explorer.html`.
2. Open it in Chrome (double-click, or drag it into a browser window).

## Features

- Search by subreddit (`r/`) or user (`u/`)
- Filters: minimum score, date, sort order
- Handles images, GIFs, native Reddit video, RedGifs embeds, and multi-image galleries
- Favorite subs/users, saved locally, with JSON import/export
- Adjustable card size, keyboard navigation (arrow keys, Esc)
- Dual data backend (Arctic Shift / PullPush) with automatic fallback if one is down
- Responsive layout — sidebar becomes a slide-in drawer on narrow screens

## Data source

Post data is fetched client-side from public Reddit-mirror APIs ([Arctic Shift](https://arctic-shift.photon-reddit.com/), [PullPush](https://pullpush.io/)) — no server or API key of your own required.

## Testing

A Playwright smoke test covers the responsive drawer, an XSS regression check, and reload persistence:

```
npm install
npm test
```

`npm install` pulls in Playwright and (on first run only) downloads a Chromium binary (~150-300MB, cached afterward) — this is dev tooling only, not required to use the app itself.
