# Tabskin Changelog

**[Русская версия](Update.ru.md)**

This file documents project history reconstructed from git commits. Commit messages are the primary source; detailed descriptions are inferred from diffs.

## Version Numbering

Two schemes coexist:

| Scheme | Example | Purpose |
|--------|---------|---------|
| `manifest.json` version | `1.1.0` | Chrome Web Store / Firefox Add-ons, zip artifact names |
| Git commit labels | `Update 1.6.1` | Internal development milestones |

Starting with **Update 1.5.8**, the store version in `manifest.json` was reset to `1.1.0` for publication. Later `Update 1.5.x` / `1.6.x` labels are milestone names, not store versions.

To find a commit by label: `git log --oneline --grep="Update 1.6.4"`.

---

## Update 1.6.4 — 2026-07-01

**manifest version:** `1.1.0` → `1.1.1`

### Extension

- **Settings modal markup moved to `index.html`** — settings UI now lives in `<template id="settingsModalTemplate">`; `SettingsManager.loadSettingsHTML()` clones the template instead of embedding a large HTML string in `settings.js` (clearer AMO source, single markup source of truth)
- **Consent modal DOM construction** — `createConsentModal()` builds the dialog with `createElement` / `textContent` instead of `innerHTML`
- **Firefox data collection compliance** — `hasDownloadTrackingConsent()` checks Firefox 140+ `browser.permissions.getAll()` for optional `data_collection.technicalAndInteraction` in addition to the in-extension consent flag; `trackDownloadLocation()` is now `async` and awaits this check before `POST /download`
- **Unsplash UTM fix** — `addUnsplashUtm()` appends `&utm_…` when the URL already has query parameters; new `enrichImageMetadata()` helper; `saveImageMetadata()` returns enriched links; `applyMetadataToDom()` always applies UTM at display time (fixes legacy stored links)

### Build / Infrastructure

- **Store version bump** — `manifest.json` and `package.json` → `1.1.1`
- **Firefox manifest updates** in `scripts/build-extension.mjs`:
  - `gecko.id`: `tabskin@tabskin.ru` → `tabskinapp@gmail.com`
  - `strict_min_version`: `109.0` → `140.0`
  - Added `gecko_android.strict_min_version: 142.0`
  - Added `data_collection_permissions`: required `none`, optional `technicalAndInteraction`
- Added **`scripts/build-firefox-source.mjs`** and npm script **`build:firefox-source`** — zip of readable source + `SOURCE_CODE_README.md` for AMO source code review (`artifacts/tabskin-firefox-source-v{version}.zip`)
- Added **`scripts/minify-for-production.mjs`** — shared HTML/CSS/template-literal/JS minification helpers
- **`build-demo-embed.mjs`** refactored to use shared minify module; pre-minifies bundled JS source before esbuild; minifies final embed HTML

### Documentation

- **README.md** / **README.ru.md** — updated Firefox `gecko.id`, documented `build:firefox-source` and AMO source archive upload
- **docs/EXTENSION.md** / **docs/EXTENSION.ru.md** — Firefox manifest schema and data collection permissions
- Added **SOURCE_CODE_README.md** — step-by-step AMO reviewer guide to reproduce the Firefox production zip

---

## Update 1.6.3 — 2026-06-30

**manifest version:** `1.1.0`

### Extension

- **Settings modal redesign** — iOS-style dark grouped layout: section titles, `settings-group-card` rows, system font stack, green toggle switches
- **Custom dropdown pickers** — theme and auto-switch interval use `settings-picker` (hidden native `<select>` + trigger + portal menu with flip-above positioning, click-outside and Escape to close)
- **Simplified settings footer** — removed Close button; single **Done** button saves and closes; cache clear moved to a full-width destructive button in its own card; cache size shown as a static read-only row
- **Label copy cleanup** — removed trailing colons, shorter time-format labels (`24 hour` / `12 hour`), performance toggle renamed to “Optimized image size”
- **Demo embed mode** in `script.js` — detected via `?embed=1` or `/demo/embed/` path; isolated `localStorage` keys (`demo_*`), separate Cache API namespace, default language from `?lang=ru|en`, extra consent-modal note for website demo context

### Website

- Added **interactive demo pages** (`/demo/`, `/en/demo/`): live iframe embed, screenshot gallery, install CTA, bilingual SEO head and breadcrumbs
- Home nav **Demo** link now points to `/demo/` instead of `#preview`; unified header on all inner pages (Demo + FAQ added where missing)
- **Site styles** for demo: `.demo-live`, `.demo-frame`, fullscreen link; `.content-page--gallery` for gallery layout; content-page max-width on container; download buttons no longer inherit article link underline styles
- Updated `site/seo/pages.json`, `sitemap.xml`, and `site/seo/post-deploy.md` with demo URLs and post-deploy checks

### Build / Infrastructure

- Added **`scripts/build-demo-embed.mjs`** — bundles extension UI into `site/demo/embed/` (esbuild minify, single `app.js`, copied assets, `noindex` + `<base>` + `?lang=` patch)
- New npm script **`build:demo-embed`**; **`build:site`** now builds demo embed before SEO head injection
- Added `site/demo/embed/` to **`.gitignore`** (generated output)

### Documentation

- **README.md** / **README.ru.md** — documented `build:demo-embed` and updated `build:site` description
- **docs/SITE.md** / **docs/SITE.ru.md** and **docs/SERVER.md** / **docs/SERVER.ru.md** — deploy steps mention demo embed build

---

## Update 1.6.2 — 2026-06-30

**manifest version:** `1.1.0`

### Documentation

- Expanded **README.md** and **README.ru.md**: three-component overview (extension, site, server), full repo structure, quick start, versioning, extended test checklist, links to detailed docs
- Added centered README header with logo and shields (website, Chrome Web Store, Firefox Add-ons, GitHub, version, Manifest V3, Node.js, stars, languages)
- Created **docs/** with bilingual guides:
  - `docs/EXTENSION.md` / `docs/EXTENSION.ru.md` — extension architecture, storage keys, build pipeline
  - `docs/SITE.md` / `docs/SITE.ru.md` — SEO pipeline, `pages.json`, site commands
  - `docs/SERVER.md` / `docs/SERVER.ru.md` — API routes, deployment, environment variables
- Created **Update.md** and **Update.ru.md** — full project changelog from git history (Update commits and milestones)
- Added **`.env.example`** — template for server configuration (`UNSPLASH_KEY`, proxy, cache TTL)

### Website

- Removed **Microsoft Edge** from marketing: hero browser list, download section card, privacy copy, and related strings in `translations.js`
- Switched site assets and scripts to **root-relative paths** (`/assets/...`, `/translations.js`) so nested pages load correctly
- Replaced relative home links (`index.html`) with `/` across pages
- Added `rel="noopener noreferrer"` on Chrome Web Store and Firefox Add-ons links
- Reworked **privacy pages** (RU/EN) to the shared `content-page` layout: header nav, breadcrumbs, `content-article` structure
- Major **styles.css** polish for content pages: articles, FAQ blocks, blog cards, CTAs, link pills, `kbd`, mobile spacing
- Added missing download note on the **English home page**
- Accessibility pass on inner pages: `aria-label` on breadcrumbs and header navigation (blog, FAQ, install guides, alternatives)
- Minor RSS feed timestamp updates

### Server / Infrastructure

- **Simplified deployment model**: removed embedded HTTPS server (Let's Encrypt on port 443) and HTTP→HTTPS redirect on port 80; Node now listens on `HOST` + `PORT` (default `127.0.0.1:3000`) behind nginx
- Added **SOCKS5 proxy** support for Unsplash requests (`USE_PROXY`, `PROXY_HOST`, `PROXY_PORT`, credentials)
- Added 30s fetch timeouts and `User-Agent: TabSkin/1.0` on `/photos` and `/download`
- Proxy support on the `/download` route
- Cleaned up verbose comments and redundant static-file debug logging
- Improved `sendFile` error handling (`!res.headersSent` guard)

---

## Update 1.6.1 — 2026-06-30

**manifest version:** `1.1.0`

### Website

- Added SEO build pipeline: `npm run build:site`, `validate:site`, `migrate:site-head`
- Created `site/seo/pages.json` as central page metadata registry
- Added `scripts/lib/render-head.mjs`, `render-schema.mjs`, `build-site-lib.mjs`
- Injected JSON-LD schemas (SoftwareApplication, WebSite, FAQPage, HowTo, Article, BreadcrumbList) on all pages
- Added RSS feeds: `site/blog/feed.xml`, `site/en/blog/feed.xml`
- New blog articles: `minimalistichnaya-novaya-vkladka`, `best-new-tab-wallpapers`
- Expanded all existing pages with full SEO head markup
- Added `site/seo/audit.md` and `site/seo/post-deploy.md`
- Updated sitemap with hreflang and new URLs

### Server / Infrastructure

- Minor `server.js` adjustment (static file handling)

---

## Update 1.6.0 — 2026-06-30

**manifest version:** `1.1.0`

### Website

- Launched multi-page bilingual site structure (RU + EN mirrors)
- Added pages: FAQ, Chrome/Firefox install guides, alternatives comparison, blog index and articles
- Expanded home page with install CTAs and feature sections
- Added `site/seo-keywords.json` for keyword cluster tracking
- Rebuilt `sitemap.xml` with hreflang alternates for all new URLs
- Updated `robots.txt` for expanded site structure
- Extended `site/styles.css` and `site/translations.js`

---

## Update 1.5.9 — 2026-05-27

**manifest version:** `1.1.0`

### Extension

- Minor UI/UX fixes in settings module and stylesheet
- Small adjustments to core script logic

---

## Update 1.5.8 — 2026-05-13

**manifest version:** `1.5.5` → `1.1.0`

### Extension

- **Pin background** — keep favorite wallpaper across sessions (`pinnedImage` storage, pin button UI)
- **Performance mode** — optimized image size setting in settings
- Improved image cache with `backgroundImageCacheIndex` and better cache management
- Enhanced consent modal with keyboard focus trap and accessibility
- Refactored settings loading with normalized settings and cached reads
- Major `script.js` refactor: request deduplication, clock formatter, improved error handling
- Restored full-size extension icons
- Updated `SettingsManager` with performance mode toggle and UI improvements
- Large `style.css` update for pin button, consent modal, and layout polish

### Build / Infrastructure

- Build script adjustments for new assets (`pin_icon.svg`)
- Package version bump in `package.json`

---

## Update 1.5.7 — 2026-05-12

**manifest version:** `1.5.5`

### Extension

- Minor fixes in `script.js` and `settings.js`
- Optimized extension PNG icons (smaller file sizes)
- Small `index.html` and `style.css` updates

### Build / Infrastructure

- **Introduced reproducible build pipeline** with `package.json` and npm scripts
- Added `scripts/build-extension.mjs` (esbuild bundle, minify, zip artifacts)
- Added `scripts/validate-extension-assets.mjs` and `scripts/generate-icons.mjs`
- Generated output: `dist/chrome/`, `dist/firefox/`, `artifacts/*.zip`
- Updated README.md and README.ru.md with build documentation
- Added `dist/` and `artifacts/` to `.gitignore`

---

## Update 1.5.6 — 2026-05-12

**manifest version:** `1.5.5`

### Website

- Major redesign of home page and site styles
- Added `site/uninstall.html` — uninstall feedback page (`noindex`)
- Refactored `site/script.js` and `site/translations.js`
- Updated privacy page layout
- Sitemap and content structure improvements

---

## Released 1.0 — 2025-08-26

**manifest version:** `1.5.5`

### Extension

- **Public release** — API endpoints moved to standard HTTPS paths without port:
  - `https://tabskin.ru/photos`
  - `https://tabskin.ru/download`
- Added **user consent modal** for Unsplash download location tracking
- Download tracking only fires after user consent
- Removed `storage` permission from manifest
- Extension stylesheet refactor

### Website

- **First public marketing site** at tabskin.ru
- Home page, privacy policy, robots.txt, sitemap.xml
- Site assets: screenshots (PNG + WebP), browser logos, favicons, PWA icons
- `site/styles.css`, `site/script.js`, `site/translations.js` (RU/EN client i18n)

### Server

- Server refactor to serve static site files alongside API routes

---

## Update 1.5.5 — 2025-07-04

**manifest version:** `1.5.5`

### Extension

- Migrated API endpoint from `it-cube32.ru:8000` to `https://tabskin.ru:8000`
- Updated CSP and `host_permissions` for new domain

### Server

- Major server rewrite: static file serving from `site/`, ETag support, path traversal protection
- Added SOCKS5 proxy support for Unsplash API (`USE_PROXY`, `PROXY_*` env vars)
- Enabled `trust proxy` for rate limiting behind reverse proxy
- Improved logging with timestamps
- Default port changed from 8000 to 3000 (with HTTPS support path in earlier iteration)

---

## Update 1.5.4 — 2025-06-27

**manifest version:** `1.5.3` → `1.5.4`

### Extension

- Added Unsplash **download location tracking** via `POST /download`
- Switched author link from portfolio URL to Unsplash profile (`user.links.html`)
- Added UTM parameters to stored Unsplash links
- Simplified error toast on image load failure
- Version bump to 1.5.4 (second commit is version-only fix)

### Server

- New `POST /download` route — proxies Unsplash download endpoint with API key
- Added `host_permissions` for `/download` endpoint

---

## Update 1.5.3 — 2025-06-24

**manifest version:** `1.5.3`

### Extension

- Added UTM parameters (`utm_source=tabskin&utm_medium=referral`) to Unsplash photo and author links

---

## Update 1.5.2 — 2025-06-23

**manifest version:** `1.5.2`

### Server

- Added rate limiting on `/photos`: 20 requests per hour per IP
- Integrated `express-rate-limit` middleware

---

## Update 1.5.1 — 2025-06-22

**manifest version:** `1.5.1`

### Extension

- UI polish: cache info layout, settings label text ("Clear cache" instead of "Clear cache now")
- Minor stylesheet spacing fixes
- Translation comment cleanup

---

## Update 1.5.0 — 2025-06-22

**manifest version:** `1.5.0`

### Extension

- **Major refactor** — largest single extension update
- Extracted settings into `assets/js/settings.js` (`SettingsManager` class)
- Full in-page i18n (EN/RU) with `data-i18n` attributes
- Added 12-hour and 24-hour time format settings
- Expanded wallpaper theme list (10 themes)
- Auto-switch background with configurable interval
- Smooth transition animations (toggleable)
- Cache API image caching with size limit and TTL
- Retry logic and user-friendly error toasts
- Settings modal moved to lazy-loaded embedded HTML
- Accessibility improvements (ARIA labels)
- Complete stylesheet redesign

---

## Update 1.4.2 — 2025-06-21

**manifest version:** `1.4.2`

### Extension

- Self-hosted Montserrat font (`font/Montserrat.woff2`) instead of Google Fonts CDN
- Added cache and localStorage clear functions (`clearCache`, `clearLocalStorage`, `clearAllData`)
- Accessibility: `aria-label` on buttons, English default for settings UI
- Removed secondary API host from manifest

### Server / Infrastructure

- Server logging and request handling improvements
- Added `.gitignore`

---

## Add README.md — 2025-06-01

### Documentation

- Initial `README.md` (English) and `README.ru.md` (Russian)
- Documented extension features, build commands, and project structure

---

## Update RU and EN locales for version 1.4.1 — 2025-06-01

**manifest version:** `1.4.1`

### Extension

- Localized extension name and description via `_locales/en/messages.json` and `_locales/ru/messages.json`
- Manifest `name` changed to `__MSG_extensionName__`
- Minor manifest adjustments

---

## Initial upload files — 2025-05-21

**manifest version:** `1.4.0`

### Extension

- **Project inception** — MVP new tab extension
- Core files: `index.html`, `script.js`, `style.css`, `manifest.json`
- Unsplash wallpaper loading via custom API endpoint
- Basic settings: theme, auto-switch, transitions
- Clock display, refresh button, image attribution
- SVG icon sprite, PNG extension icons
- Chrome i18n locale files (EN/RU)
- `localStorage` for settings and last image metadata

### Server

- Initial `server.js` — Express proxy to Unsplash `/photos/random` with in-memory cache
