#!/usr/bin/env node
import { buildSite } from "./lib/build-site-lib.mjs"

const result = buildSite()
console.log(`Built ${result.built}/${result.pages} pages. Sitemap lastmod: ${result.lastmod}`)
