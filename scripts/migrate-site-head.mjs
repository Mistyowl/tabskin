#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { SITE_DIR } from "./lib/site-constants.mjs"
import { loadPagesConfig, resolvePageFile } from "./lib/build-site-lib.mjs"

const { pages } = loadPagesConfig()

for (const page of pages) {
  const filePath = resolvePageFile(page)
  if (!fs.existsSync(filePath)) continue
  let html = fs.readFileSync(filePath, "utf8")
  if (html.includes("<!-- @head -->")) continue
  html = html.replace(/<head>[\s\S]*?<\/head>/, "<!-- @head -->")
  fs.writeFileSync(filePath, html, "utf8")
  console.log(`migrated: ${page.file}`)
}
