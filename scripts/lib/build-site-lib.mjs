import fs from "node:fs"
import path from "node:path"
import { BASE_URL, SITE_DIR, SEO_DIR } from "./site-constants.mjs"
import { renderHead } from "./render-head.mjs"

export function loadPagesConfig() {
  const raw = JSON.parse(fs.readFileSync(path.join(SEO_DIR, "pages.json"), "utf8"))
  const defaults = raw.defaults || {}
  const pages = raw.pages.map((page) => ({
    analytics: { ...defaults.analytics, ...page.analytics },
    og: { ...defaults.og, ...page.og },
    stylesheet: page.stylesheet || defaults.stylesheet,
    sitemap: page.sitemap === false ? false : { ...defaults.sitemap, ...page.sitemap },
    ...page,
  }))
  return { defaults, pages }
}

export function injectHead(html, headHtml) {
  if (html.includes("<!-- @head -->")) {
    return html.replace("<!-- @head -->", headHtml)
  }
  return html.replace(/<head>[\s\S]*?<\/head>/, headHtml)
}

export function resolvePageFile(page) {
  return path.join(SITE_DIR, page.file.replace(/\//g, path.sep))
}

export function generateSitemap(pages, lastmod) {
  const indexed = pages.filter((p) => p.sitemap !== false && p.robots !== "noindex, nofollow")
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ]

  for (const page of indexed) {
    const loc = `${BASE_URL}${page.path}`
    const { changefreq, priority } = page.sitemap
    lines.push("  <url>")
    lines.push(`    <loc>${loc}</loc>`)
    lines.push(`    <lastmod>${lastmod}</lastmod>`)
    lines.push(`    <changefreq>${changefreq}</changefreq>`)
    lines.push(`    <priority>${priority}</priority>`)
    if (page.alternates?.ru) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="ru" href="${BASE_URL}${page.alternates.ru}"/>`)
    }
    if (page.alternates?.en) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${page.alternates.en}"/>`)
    }
    if (page.alternates?.xDefault) {
      lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${page.alternates.xDefault}"/>`)
    }
    lines.push("  </url>")
  }

  lines.push("</urlset>")
  return `${lines.join("\n")}\n`
}

export function generateFeed(pages, lang) {
  const articles = pages
    .filter((p) => p.feed?.lang === lang)
    .sort((a, b) => (b.article?.datePublished || "").localeCompare(a.article?.datePublished || ""))

  const title = lang === "ru" ? "Блог Tabskin" : "Tabskin Blog"
  const description =
    lang === "ru"
      ? "Статьи о новой вкладке, обоях Unsplash и минимализме"
      : "Articles about new tabs, Unsplash wallpapers, and minimalism"
  const link = lang === "ru" ? `${BASE_URL}/blog/` : `${BASE_URL}/en/blog/`
  const now = new Date().toUTCString()

  const items = articles
    .map((page) => {
      const url = `${BASE_URL}${page.path}`
      const pubDate = new Date(page.article.datePublished).toUTCString()
      return `    <item>
      <title>${escapeXml(page.feed.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(page.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${link}</link>
    <description>${escapeXml(description)}</description>
    <language>${lang}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${link}feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildSite() {
  const { pages } = loadPagesConfig()
  const lastmod = new Date().toISOString().slice(0, 10)
  let built = 0

  for (const page of pages) {
    const filePath = resolvePageFile(page)
    if (!fs.existsSync(filePath)) {
      console.warn(`skip missing file: ${page.file}`)
      continue
    }
    const html = fs.readFileSync(filePath, "utf8")
    const headHtml = renderHead(page)
    const output = injectHead(html, headHtml)
    fs.writeFileSync(filePath, output, "utf8")
    built++
  }

  const sitemap = generateSitemap(pages, lastmod)
  fs.writeFileSync(path.join(SITE_DIR, "sitemap.xml"), sitemap, "utf8")

  fs.writeFileSync(path.join(SITE_DIR, "blog", "feed.xml"), generateFeed(pages, "ru"), "utf8")
  fs.writeFileSync(path.join(SITE_DIR, "en", "blog", "feed.xml"), generateFeed(pages, "en"), "utf8")

  return { built, pages: pages.length, lastmod }
}
