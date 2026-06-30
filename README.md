<div align="center">

<img src="assets/icons/icon_128x128.png" alt="Tabskin logo" width="88" height="88">

# Tabskin

**A calm, minimal new tab with curated Unsplash wallpapers**

[![Website](https://img.shields.io/badge/website-tabskin.ru-181825?style=for-the-badge)](https://tabskin.ru)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/phpikmllcahonchladgmhcphhhebncmp)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-FF7139?style=for-the-badge&logo=firefox&logoColor=white)](https://addons.mozilla.org/addon/tabskin)
[![GitHub](https://img.shields.io/badge/GitHub-Mistyowl%2Ftabskin-181717?style=for-the-badge&logo=github)](https://github.com/Mistyowl/tabskin)

[![Version](https://img.shields.io/badge/version-1.1.0-5c6bc0?style=flat-square)](manifest.json)
[![Manifest](https://img.shields.io/badge/Manifest-V3-34a853?style=flat-square)](manifest.json)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](package.json)
[![GitHub stars](https://img.shields.io/github/stars/Mistyowl/tabskin?style=flat-square&logo=github)](https://github.com/Mistyowl/tabskin/stargazers)
[![Languages](https://img.shields.io/badge/languages-EN%20%7C%20RU-5c6bc0?style=flat-square)](_locales/)

**[Русская версия](README.ru.md)** · [Changelog](Update.md)

</div>

---

Tabskin is a browser extension that replaces the default new tab with a calm, minimal page featuring curated Unsplash wallpapers, the current time, author attribution, local personalization settings, caching, and optional automatic background rotation.

The repository contains three related components:

1. **Extension** — source in the project root, production packages in `dist/` and `artifacts/`
2. **Website** — marketing site at [tabskin.ru](https://tabskin.ru) in `site/`
3. **API server** — Unsplash proxy in `server.js`

## Features

- Minimal new tab override for Chromium and Firefox browsers
- Curated Unsplash wallpaper themes: wallpapers, nature, 3D render, texture, space, travel, film, people, architecture, street photography
- Current time display with 12-hour and 24-hour formats
- Pin background to keep a favorite image across sessions
- Performance mode for optimized image sizes
- Photographer and photo attribution links for Unsplash compliance
- Local settings for language, time format, theme, auto-switch interval, and transition behavior
- Image caching through the Cache API to reduce network requests
- Consent flow for Unsplash download location tracking (accessible modal with focus trap)
- English and Russian localization
- Production builds with minified JS/CSS and generated release zips
- Bilingual marketing site with blog, FAQ, install guides, and SEO pipeline

## Quick Start

```bash
npm install
npm run build          # extension → dist/ and artifacts/
npm run build:site     # inject SEO head markup into site/*.html
npm run validate:extension
npm run validate:site
```

## Project Structure

```text
.
├── assets/
│   ├── icons/              # PNG icons + SVG UI sprites
│   ├── js/settings.js      # SettingsManager module
│   └── sprite.svg
├── _locales/
│   ├── en/messages.json
│   └── ru/messages.json
├── docs/                   # Detailed documentation (see links below)
├── scripts/
│   ├── build-extension.mjs
│   ├── build-site.mjs
│   ├── generate-icons.mjs
│   ├── migrate-site-head.mjs
│   ├── validate-extension-assets.mjs
│   ├── validate-site-seo.mjs
│   └── lib/                # Site SEO render helpers
├── site/
│   ├── blog/               # RU blog articles + feed.xml
│   ├── en/                 # English mirror (/, /blog/, /faq/, …)
│   ├── install/            # Chrome & Firefox install guides
│   ├── seo/
│   │   ├── pages.json      # Page meta, schema, sitemap config
│   │   ├── audit.md
│   │   └── post-deploy.md
│   ├── templates/
│   ├── index.html
│   ├── styles.css
│   └── sitemap.xml
├── index.html              # Extension new tab page
├── manifest.json
├── script.js
├── style.css
├── server.js               # Unsplash API proxy (not in extension packages)
├── package.json
└── package-lock.json
```

Generated directories (gitignored):

- `dist/chrome/` — unpacked Chrome extension build
- `dist/firefox/` — unpacked Firefox extension build
- `artifacts/` — zipped store-ready packages

## Documentation

| Topic | English | Russian |
|-------|---------|---------|
| Extension architecture & build | [docs/EXTENSION.md](docs/EXTENSION.md) | [docs/EXTENSION.ru.md](docs/EXTENSION.ru.md) |
| Website & SEO pipeline | [docs/SITE.md](docs/SITE.md) | [docs/SITE.ru.md](docs/SITE.ru.md) |
| API server & deployment | [docs/SERVER.md](docs/SERVER.md) | [docs/SERVER.ru.md](docs/SERVER.ru.md) |
| Changelog | [Update.md](Update.md) | [Update.ru.md](Update.ru.md) |

## Requirements

- Node.js 20 or newer
- npm

## Extension

Build Chrome and Firefox production packages:

```bash
npm run build
npm run build:chrome
npm run build:firefox
```

Development watch builds:

```bash
npm run dev:chrome
npm run dev:firefox
```

Validate extension source and generated packages:

```bash
npm run validate:extension
```

Regenerate PNG extension icons:

```bash
npm run icons:generate
```

After `npm run build`, production output uses the version from `manifest.json` (currently `1.1.0`):

```text
dist/chrome/
dist/firefox/
artifacts/tabskin-chrome-v1.1.0.zip
artifacts/tabskin-firefox-v1.1.0.zip
```

Production builds bundle `script.js` and `assets/js/settings.js` into `app.js`, minify with esbuild, strip `console.*` and `debugger`, generate browser-specific manifests, and exclude `site/`, `server.js`, and build scripts from release zips.

Firefox builds add `browser_specific_settings.gecko.id: tabskin@tabskin.ru`.

See [docs/EXTENSION.md](docs/EXTENSION.md) for architecture, storage keys, and contributor notes.

### Loading Unpacked Builds

**Chrome:** `chrome://extensions/` → Developer mode → Load unpacked → `dist/chrome`

**Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `dist/firefox/manifest.json`

## Website

The `site/` folder is the marketing website and is **not** included in extension packages.

```bash
npm run build:demo-embed # extension UI → site/demo/embed/ (also runs via build:site)
npm run build:site      # demo embed + inject head from site/seo/pages.json
npm run validate:site   # check SEO tags, hreflang, sitemap
npm run migrate:site-head   # reset HTML heads to <!-- @head --> markers
```

Post-deploy checklist: [site/seo/post-deploy.md](site/seo/post-deploy.md)

See [docs/SITE.md](docs/SITE.md) for the full SEO workflow.

## API Server

The extension fetches wallpapers from:

- `https://tabskin.ru/photos`
- `https://tabskin.ru/download`

These origins are declared in `manifest.json` via `host_permissions` and CSP.

Run locally (requires `.env` — copy from `.env.example`):

```bash
node server.js
```

See [docs/SERVER.md](docs/SERVER.md) for routes, environment variables, and deployment.

## Versioning

Two version schemes coexist in this repository:

| Scheme | Example | Used for |
|--------|---------|----------|
| `manifest.json` version | `1.1.0` | Chrome Web Store / Firefox Add-ons, zip artifacts |
| Commit labels | `Update 1.6.1` | Internal development milestones in git history |

Store version was reset to `1.1.0` in **Update 1.5.8** for publication; later `Update 1.5.x` / `1.6.x` commits are milestone labels, not store versions.

Full history: [Update.md](Update.md)

## Release Packages

Upload to browser stores:

- Chrome Web Store: `artifacts/tabskin-chrome-v1.1.0.zip`
- Firefox Add-ons: `artifacts/tabskin-firefox-v1.1.0.zip`

Before publishing:

```bash
npm run validate:extension
npm run build
```

Then manually test both unpacked builds.

## Manual Test Checklist

- New tab opens Tabskin
- Initial image loads or cached image is restored
- Refresh button loads a new image
- Pin button pins and unpins the current background
- Consent modal appears when needed, is keyboard-accessible, and stores consent locally
- Unsplash author and photo links open correctly (with UTM parameters)
- Settings modal opens and closes with focus trap
- Settings can be saved (language, time format, theme, auto-switch, transitions, performance mode)
- Language switch works
- 12-hour and 24-hour time formats work
- Auto-switch timer works (minimum 15 minutes)
- Clear cache works
- Production console has no debug logs, aside from real browser/network errors

## Extension Settings

Settings are saved locally in the browser through `localStorage`. Keys are kept stable for backward compatibility:

- `userSettings`
- `lastImageUrl`, `lastImageCreator`, `lastImagePhotoLink`, `lastImageCreatorLink`, `lastImageLoadTime`
- `userConsentDownloadLocation`
- `pinnedImage`
- `backgroundImageCacheIndex`

## Notes For Contributors

- Do not edit files in `dist/` manually — they are generated
- Do not put website files from `site/` into extension packages
- Keep Chrome and Firefox differences in `scripts/build-extension.mjs` manifest generation
- If a local asset is referenced from `manifest.json`, `index.html`, or `style.css`, `npm run validate:extension` must find it
- Edit page SEO in `site/seo/pages.json`, then run `npm run build:site`
- Keep production builds small: avoid unnecessary runtime dependencies and debug logs

## License

Tabskin is maintained by the Tabskin project.
