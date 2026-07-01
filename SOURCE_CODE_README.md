# Tabskin — Firefox extension source code

This archive contains the **human-readable source** used to build the Tabskin Firefox add-on submitted to Mozilla Add-ons (AMO). The submitted XPI/ZIP is a **production build** (minified and bundled). Reviewers can reproduce that exact package by following the steps below.

## What is in this archive

| Path | Purpose |
|------|---------|
| `manifest.json` | Base extension manifest (Firefox-specific keys are added at build time) |
| `index.html` | New tab page markup (includes `<template>` for settings UI) |
| `script.js` | Main extension logic (readable source) |
| `assets/js/settings.js` | Settings module (readable source) |
| `style.css` | Stylesheet (readable source) |
| `_locales/` | Extension name/description i18n |
| `assets/` | Icons and SVG sprites |
| `package.json`, `package-lock.json` | Node.js dependencies for the build |
| `scripts/build-extension.mjs` | Build script (bundle, minify, Firefox manifest, zip) |
| `scripts/validate-extension-assets.mjs` | Source/dist validation |

**Not included** (not part of the extension package): marketing website (`site/`), API server (`server.js`), `node_modules/`, `dist/`, `artifacts/`.

## Build environment

| Requirement | Version |
|-------------|---------|
| **Operating system** | Windows 10+, macOS 12+, or Linux (any OS supported by Node.js 18+) |
| **Node.js** | **18.x or newer** (20 LTS recommended) |
| **npm** | **9.x or newer** (bundled with Node.js) |

### Install Node.js and npm

1. Download Node.js LTS from https://nodejs.org/
2. Install with default options.
3. Verify in a terminal:

```bash
node --version
npm --version
```

## Step-by-step: reproduce the Firefox add-on package

Run all commands from the **root of this archive** (the folder that contains `package.json`).

### 1. Install build dependencies

```bash
npm ci
```

Use `npm install` if `npm ci` fails (for example, when `package-lock.json` was generated on another platform).

### 2. Validate source assets

```bash
npm run validate:extension
```

Expected output: `Extension validation passed.`

### 3. Build the Firefox production package

```bash
npm run build:firefox
```

This script (`scripts/build-extension.mjs --target=firefox --mode=production`):

1. Validates all referenced source files exist
2. Writes a Firefox-specific `manifest.json` (`gecko.id`, `data_collection_permissions`, `strict_min_version`)
3. Bundles `script.js` + `assets/js/settings.js` into a single `app.js` via **esbuild**
4. Minifies JavaScript and CSS via **esbuild**
5. Minifies `index.html` and replaces two `<script>` tags with one `app.js` reference
6. Copies `_locales/` and `assets/` (except bundled `assets/js/`)
7. Creates `artifacts/tabskin-firefox-v{version}.zip`

### 4. Output locations

| Output | Description |
|--------|-------------|
| `dist/firefox/` | Unpacked production build (load via `about:debugging` for testing) |
| `artifacts/tabskin-firefox-v1.1.1.zip` | **Production zip submitted to AMO** (version matches `manifest.json`) |

The contents of `artifacts/tabskin-firefox-v*.zip` must match the add-on file uploaded to AMO for the same version.

## Build tools disclosure (AMO)

This extension uses:

- **esbuild** (^0.28) — bundles `script.js` + `settings.js` into `app.js`; minifies JS and CSS
- **archiver** (^8.0) — creates the release zip in `artifacts/`
- **Custom script** `scripts/build-extension.mjs` — HTML minification, Firefox manifest generation

There is **no** web template engine (no Pug, Handlebars, etc.). Settings markup lives in `<template id="settingsModalTemplate">` inside `index.html`.

## Manual smoke test (optional)

1. Open Firefox → `about:debugging` → This Firefox → Load Temporary Add-on
2. Select `dist/firefox/manifest.json`
3. Open a new tab; agree to the consent dialog; test refresh and settings

## Public repository

Source is also available at: https://github.com/Mistyowl/tabskin
