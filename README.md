# Reddit Explorer

A single-file, no-install Reddit browser. Search any subreddit or user, browse their post history as an image/video gallery, and save favorites — all client-side.

Two versions are provided — pick one, they're otherwise identical:

- **`reddit-explorer.html`** — the standard browser. Use this unless you specifically need bulk downloading.
- **`reddit-explorer-dl.html`** — adds a "Rip Entire Profile" bulk zip-download feature. See [Bulk download](#bulk-download-reddit-explorer-dlhtml) below before using it — it routes media through third-party proxies.

## Usage

1. Download `reddit-explorer.html` (or `reddit-explorer-dl.html`).
2. Open it in Chrome (double-click, or drag it into a browser window).

## Features

- Search by subreddit (`r/`) or user (`u/`)
- Filters: minimum score, date, sort order
- Media type toggles (images / GIFs / videos & embeds / gallery posts) and a blocked-domains list to hide specific hosts (e.g. RedGifs) from results
- Handles images, GIFs, native Reddit video, RedGifs embeds, and multi-image galleries
- Favorite subs/users, saved locally, with JSON import/export
- Adjustable card size, keyboard navigation (arrow keys, Esc)
- Dual data backend (Arctic Shift / PullPush) with automatic fallback if one is down
- Responsive layout — sidebar becomes a slide-in drawer on narrow screens

## Bulk download (`reddit-explorer-dl.html`)

The DL version adds a **Rip Entire Profile** button that scans the full search result set (respecting the active score/date/media-type/blocked-domain filters), downloads every matching file, and packages them into a single zip via [JSZip](https://stuk.github.io/jszip/).

**Privacy/security note:** most Reddit-hosted media (`preview.redd.it` in particular) blocks cross-origin fetches from a page like this one. When a direct fetch fails, the DL version falls back to routing that request through a public CORS proxy (in order: `wsrv.nl`, `corsproxy.io`, `allorigins.win`, `thingproxy.freeboard.io`). That means:

- The media URLs being ripped (and by extension, some of your browsing activity — which subs/users/posts you're pulling from) are visible to whichever third-party proxy handles the request.
- These are free public proxies with no guarantees about logging, uptime, or trustworthiness — don't rip anything you wouldn't want passing through an unknown third party.
- The standard `reddit-explorer.html` never does this — it only ever talks to Arctic Shift/PullPush and whatever host each post's media actually lives on, with no proxy fallback.

If that tradeoff isn't acceptable for a given session, use the standard version instead.

## Data source

Post data is fetched client-side from public Reddit-mirror APIs ([Arctic Shift](https://arctic-shift.photon-reddit.com/), [PullPush](https://pullpush.io/)) — no server or API key of your own required.

## Testing

A Playwright smoke test covers the responsive drawer, an XSS regression check, and reload persistence:

```
npm install
npm test
```

`npm install` pulls in Playwright and (on first run only) downloads a Chromium binary (~150-300MB, cached afterward) — this is dev tooling only, not required to use the app itself.

## Contributors

Thanks to the contributors who prefer to remain anonymous — some of this app's features started as their patches.
