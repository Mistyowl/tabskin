# SEO Audit Checklist — Tabskin

Run `npm run validate:site` after `npm run build:site` for automated checks.

## Per-page checklist (18 indexed pages + uninstall)

| Check | Requirement |
|-------|-------------|
| `html lang` | Matches page language (`ru` / `en`) |
| `title` | Unique, 50–60 chars, primary keyword |
| `meta description` | Unique, 140–160 chars, includes CTA |
| `canonical` | Absolute `https://tabskin.ru/...` URL |
| `hreflang` | `ru` + `en` + `x-default` on paired pages |
| `robots` | `index, follow` (uninstall: `noindex, nofollow`) |
| Open Graph | `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `og:locale`, `og:site_name` |
| Twitter Card | `summary_large_image` + title/description/image |
| Favicon | apple-touch-icon, 32x32, 16x16 |
| `theme-color` | `#181825` |
| `preconnect` | fonts.googleapis.com, fonts.gstatic.com |
| JSON-LD | Per page type (see below) |
| H1 | Single H1, matches search intent |
| Images | Meaningful `alt` text (logo: `Tabskin`) |
| Internal links | install ↔ faq ↔ alternatives ↔ blog |

## Schema by page type

| Page type | Required schema |
|-----------|-----------------|
| Home | `SoftwareApplication`, `WebSite`, `FAQPage` |
| FAQ | `FAQPage`, `BreadcrumbList` |
| Install | `HowTo`, `BreadcrumbList` |
| Blog article | `Article` (with url, image, mainEntityOfPage), `BreadcrumbList` |
| Blog index | `BreadcrumbList` |
| Alternatives | `BreadcrumbList` |
| Privacy | `BreadcrumbList` (optional) |

## Performance

- Hero LCP image: `fetchpriority="high"` + `<link rel="preload">`
- Below-fold images: `loading="lazy"` + `decoding="async"`
- Fonts: Google Fonts with `display=swap`

## External validation (post-deploy)

1. [Google Rich Results Test](https://search.google.com/test/rich-results)
2. [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
3. PageSpeed Insights — LCP < 2.5s on homepages
4. Google Search Console — resubmit `sitemap.xml`
5. Yandex Webmaster — resubmit `sitemap.xml`, check hreflang
