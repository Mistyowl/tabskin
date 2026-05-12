# Tabskin

**[Русская версия](README.ru.md)**

Tabskin is a browser extension that replaces the default new tab with a calm, minimal page featuring curated Unsplash wallpapers, the current time, author attribution, local personalization settings, caching, and optional automatic background rotation.

The repository now uses a reproducible extension build pipeline. Source files live in the project root, while production-ready packages are generated into separate Chrome and Firefox outputs.

## Features

- Minimal new tab override for Chromium and Firefox browsers.
- Curated Unsplash wallpaper themes: wallpapers, nature, 3D render, texture, space, travel, film, people, architecture, and street photography.
- Current time display with 12-hour and 24-hour formats.
- Photographer and photo attribution links for Unsplash compliance.
- Local settings for language, time format, theme, auto-switch interval, and transition behavior.
- Image caching through the Cache API to reduce network requests.
- Consent flow for Unsplash download location tracking.
- English and Russian localization.
- Production builds with minified JS/CSS and generated release zips.

## Project Structure

```text
.
├── assets/
│   ├── icons/
│   ├── js/settings.js
│   └── sprite.svg
├── _locales/
│   ├── en/messages.json
│   └── ru/messages.json
├── scripts/
│   ├── build-extension.mjs
│   ├── generate-icons.mjs
│   └── validate-extension-assets.mjs
├── index.html
├── manifest.json
├── script.js
├── style.css
├── package.json
└── package-lock.json
```

Generated directories:

- `dist/chrome/` — unpacked Chrome extension build.
- `dist/firefox/` — unpacked Firefox extension build.
- `artifacts/` — zipped store-ready packages.

The `site/` folder is the marketing website and is not included in extension packages. `server.js` is also excluded from extension packages.

## Requirements

- Node.js 20 or newer.
- npm.

## Install Dependencies

```bash
npm install
```

## Build Commands

Build Chrome and Firefox production packages:

```bash
npm run build
```

Build only Chrome:

```bash
npm run build:chrome
```

Build only Firefox:

```bash
npm run build:firefox
```

Validate extension source files and generated packages:

```bash
npm run validate:extension
```

Regenerate PNG extension icons from the local icon generator:

```bash
npm run icons:generate
```

Development watch builds:

```bash
npm run dev:chrome
npm run dev:firefox
```

## Build Output

After `npm run build`, the project creates:

```text
dist/chrome/
dist/firefox/
artifacts/tabskin-chrome-v1.1.0.zip
artifacts/tabskin-firefox-v1.1.0.zip
```

Production builds:

- bundle `script.js` and `assets/js/settings.js` into `app.js`;
- minify JavaScript and CSS with esbuild;
- remove `console.*` and `debugger` from production JavaScript;
- generate browser-specific manifests;
- copy only extension assets required for the package;
- exclude `site/`, `server.js`, build scripts, source-only files, and local development files from release zips.

## Loading Unpacked Builds

### Chrome

1. Run `npm run build:chrome`.
2. Open `chrome://extensions/`.
3. Enable Developer mode.
4. Click Load unpacked.
5. Select `dist/chrome`.

### Firefox

1. Run `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click Load Temporary Add-on.
4. Select `dist/firefox/manifest.json`.

## Release Packages

Upload these zip files to the browser stores:

- Chrome Web Store: `artifacts/tabskin-chrome-v1.1.0.zip`
- Firefox Add-ons: `artifacts/tabskin-firefox-v1.1.0.zip`

Before publishing, run:

```bash
npm run validate:extension
npm run build
```

Then manually test both unpacked builds.

## Manual Test Checklist

- New tab opens Tabskin.
- Initial image loads or cached image is restored.
- Refresh button loads a new image.
- Consent modal appears when needed and stores consent locally.
- Unsplash author and photo links open correctly.
- Settings modal opens and closes.
- Settings can be saved.
- Language switch works.
- 12-hour and 24-hour time formats work.
- Auto-switch timer works.
- Clear cache works.
- Production console has no debug logs, aside from real browser/network errors.

## Extension Settings

Settings are saved locally in the browser through `localStorage`.

Current storage keys are kept stable for backward compatibility:

- `userSettings`
- `lastImageUrl`
- `lastImageCreator`
- `lastImagePhotoLink`
- `lastImageCreatorLink`
- `lastImageLoadTime`
- `userConsentDownloadLocation`

## API Endpoints

The extension expects the image service to be available at:

- `https://tabskin.ru/photos`
- `https://tabskin.ru/download`

These origins are declared in `manifest.json` through `host_permissions` and CSP.

## Notes For Contributors

- Do not edit files in `dist/` manually. They are generated.
- Do not put website files from `site/` into extension packages.
- Keep Chrome and Firefox differences in the build manifest generation instead of maintaining separate handwritten manifests.
- If a local asset is referenced from `manifest.json`, `index.html`, or `style.css`, `npm run validate:extension` must be able to find it.
- Keep production builds small: avoid unnecessary runtime dependencies and debug logs.

## License

Tabskin is maintained by the Tabskin project.
