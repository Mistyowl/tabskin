# Site templates

Head markup is generated at build time from `site/seo/pages.json`.

- `head.njk` — reference layout (not executed; see `scripts/lib/render-head.mjs`)
- JSON-LD schemas — `scripts/lib/render-schema.mjs`

## Workflow

1. Edit page meta in `site/seo/pages.json`
2. Edit HTML body in `site/**/*.html`
3. Run `npm run build:site`
4. Run `npm run validate:site`

To reset heads to markers (optional): `npm run migrate:site-head` then `npm run build:site`
