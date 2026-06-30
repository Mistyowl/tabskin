# Post-deploy SEO checklist

Run after deploying site changes to production.

## Automated (local)

```bash
npm run build:site
npm run validate:site
```

## Manual verification

### 1. Google Rich Results Test

Test these URLs:

- https://tabskin.ru/
- https://tabskin.ru/demo/
- https://tabskin.ru/faq/
- https://tabskin.ru/install/chrome/
- https://tabskin.ru/blog/kak-izmenit-novuyu-vkladku-chrome/

Tool: https://search.google.com/test/rich-results

Expected: `SoftwareApplication`, `WebSite`, `FAQPage`, `HowTo`, `Article` without errors.

### 2. Open Graph / Twitter preview

Test home and a blog article:

- https://tabskin.ru/
- https://tabskin.ru/blog/oboi-na-novuyu-vkladku/

Tool: https://developers.facebook.com/tools/debug/

Expected: `summary_large_image`, screenshot preview, correct title/description.

### 3. PageSpeed Insights

Test:

- https://tabskin.ru/
- https://tabskin.ru/en/

Target: LCP < 2.5s, CLS < 0.1

### 4. Google Search Console

1. Open https://search.google.com/search-console
2. Sitemaps → submit `https://tabskin.ru/sitemap.xml`
3. URL Inspection → request indexing for new URLs:
   - `/en/blog/best-new-tab-wallpapers/`
   - `/blog/minimalistichnaya-novaya-vkladka/`
4. Check International targeting → hreflang report (no errors)

### 5. Yandex Webmaster

1. Open https://webmaster.yandex.ru/
2. Indexing → Sitemap files → add `https://tabskin.ru/sitemap.xml`
3. Check hreflang diagnostics after re-crawl

### 6. RSS feeds

Verify feeds load:

- https://tabskin.ru/blog/feed.xml
- https://tabskin.ru/en/blog/feed.xml

### 7. Interactive demo

Verify:

- https://tabskin.ru/demo/ — iframe loads; wallpaper, clock, pin, and settings work
- https://tabskin.ru/demo/embed/?embed=1&lang=ru — fullscreen demo without site chrome
- https://tabskin.ru/en/demo/ — English iframe (`lang=en`)

## Monitoring (1–2 weeks after deploy)

- Index coverage for 20 indexed URLs in GSC
- Position tracking for keyword clusters in `site/seo-keywords.json`
- Yandex Metrika + GA: organic traffic to `/blog/` and `/install/` pages
