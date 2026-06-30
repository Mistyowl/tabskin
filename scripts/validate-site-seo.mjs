#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { BASE_URL, SEO_DIR, SITE_DIR } from "./lib/site-constants.mjs"
import { loadPagesConfig, resolvePageFile } from "./lib/build-site-lib.mjs"

const REQUIRED_TAGS = [
  "<title>",
  'name="description"',
  'rel="canonical"',
  'property="og:title"',
  'property="og:description"',
  'property="og:url"',
  'property="og:image"',
  'property="og:site_name"',
  'name="twitter:card"',
  'name="theme-color"',
  'rel="preconnect" href="https://fonts.googleapis.com"',
]

function checkHreflangSymmetry(pages) {
  const errors = []
  const byPath = new Map(pages.map((p) => [p.path, p]))

  for (const page of pages) {
    if (!page.alternates) continue
    if (page.alternates.ru) {
      const ruPage = [...byPath.values()].find((p) => p.path === page.alternates.ru)
      if (!ruPage) errors.push(`Missing RU page for alternates.ru=${page.alternates.ru}`)
      else if (ruPage.alternates?.en !== page.path && ruPage.alternates?.ru !== page.path) {
        const enPath = page.alternates.en || page.path
        if (ruPage.alternates?.en !== enPath) {
          errors.push(`hreflang mismatch: ${page.path} <-> ${ruPage.path}`)
        }
      }
    }
  }
  return errors
}

function validateHtmlFile(page) {
  const errors = []
  const filePath = resolvePageFile(page)
  if (!fs.existsSync(filePath)) {
    errors.push(`File missing: ${page.file}`)
    return errors
  }

  const html = fs.readFileSync(filePath, "utf8")
  for (const tag of REQUIRED_TAGS) {
    if (!html.includes(tag)) errors.push(`${page.path}: missing ${tag}`)
  }

  const expectedCanonical = `${BASE_URL}${page.path}`
  if (!html.includes(`href="${expectedCanonical}"`)) {
    errors.push(`${page.path}: canonical mismatch (expected ${expectedCanonical})`)
  }

  if (page.robots && !html.includes(`content="${page.robots}"`)) {
    errors.push(`${page.path}: robots meta mismatch`)
  }

  if (page.alternates?.ru && !html.includes(`hreflang="ru"`)) {
    errors.push(`${page.path}: missing hreflang ru`)
  }
  if (page.alternates?.en && !html.includes(`hreflang="en"`)) {
    errors.push(`${page.path}: missing hreflang en`)
  }

  return errors
}

function validateSitemap(pages) {
  const errors = []
  const sitemapPath = path.join(SITE_DIR, "sitemap.xml")
  if (!fs.existsSync(sitemapPath)) {
    errors.push("sitemap.xml missing — run npm run build:site")
    return errors
  }
  const xml = fs.readFileSync(sitemapPath, "utf8")
  const indexed = pages.filter((p) => p.sitemap !== false && p.robots !== "noindex, nofollow")
  for (const page of indexed) {
    const loc = `${BASE_URL}${page.path}`
    if (!xml.includes(`<loc>${loc}</loc>`)) {
      errors.push(`sitemap missing: ${loc}`)
    }
  }
  return errors
}

function main() {
  const configPath = path.join(SEO_DIR, "pages.json")
  if (!fs.existsSync(configPath)) {
    console.error("site/seo/pages.json not found")
    process.exit(1)
  }

  const { pages } = loadPagesConfig()
  const errors = []

  errors.push(...checkHreflangSymmetry(pages))
  errors.push(...validateSitemap(pages))

  for (const page of pages) {
    errors.push(...validateHtmlFile(page))
  }

  if (errors.length) {
    console.error(`SEO validation failed (${errors.length} issues):\n`)
    for (const err of errors) console.error(`  - ${err}`)
    process.exit(1)
  }

  console.log(`SEO validation passed for ${pages.length} pages.`)
}

main()
