import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const SOURCE_HTML = "index.html"
const SOURCE_CSS = "style.css"
const SOURCE_MANIFEST = "manifest.json"
const LOCAL_REF_SKIP_RE = /^(?:$|#|data:|https?:|mailto:|chrome:|moz-extension:|about:)/i
const EXCLUDED_PACKAGE_ENTRIES = new Set(["site", "server.js"])

function toPosix(value) {
  return value.split(path.sep).join("/")
}

function readJson(relativePath, errors) {
  const absolutePath = path.join(rootDir, relativePath)
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"))
  } catch (error) {
    errors.push(`${relativePath}: invalid JSON (${error.message})`)
    return null
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath))
}

function stripQueryAndHash(value) {
  return value.split("#")[0].split("?")[0]
}

function normalizeLocalRef(value) {
  if (!value || LOCAL_REF_SKIP_RE.test(value)) return null
  const cleanValue = stripQueryAndHash(value.trim().replace(/^\/+/, ""))
  if (!cleanValue || LOCAL_REF_SKIP_RE.test(cleanValue)) return null
  return cleanValue
}

function assertExists(relativePath, context, errors) {
  if (!exists(relativePath)) {
    errors.push(`${context}: missing ${relativePath}`)
  }
}

function collectHtmlRefs(html) {
  const refs = []
  const attrRe = /\b(?:src|href)=["']([^"']+)["']/gi
  let attrMatch
  while ((attrMatch = attrRe.exec(html))) {
    const normalized = normalizeLocalRef(attrMatch[1])
    if (normalized) refs.push(normalized)
  }

  const useRe = /<use\b[^>]*\bhref=["']([^"']+)["']/gi
  let useMatch
  while ((useMatch = useRe.exec(html))) {
    const normalized = normalizeLocalRef(useMatch[1])
    if (normalized) refs.push(normalized)
  }

  return [...new Set(refs)]
}

function collectCssRefs(css) {
  const refs = []
  const urlRe = /url\(\s*["']?([^"')]+)["']?\s*\)/gi
  let match
  while ((match = urlRe.exec(css))) {
    const normalized = normalizeLocalRef(match[1])
    if (normalized) refs.push(normalized)
  }
  return [...new Set(refs)]
}

function compareLocaleKeys(errors) {
  const localesDir = path.join(rootDir, "_locales")
  if (!fs.existsSync(localesDir)) {
    errors.push("_locales: missing locales directory")
    return
  }

  const localeFiles = ["_locales/en/messages.json", "_locales/ru/messages.json"]
  const parsedLocales = localeFiles.map((file) => [file, readJson(file, errors)])
  if (parsedLocales.some(([, json]) => !json)) return

  const [enFile, enJson] = parsedLocales[0]
  const [ruFile, ruJson] = parsedLocales[1]
  const enKeys = Object.keys(enJson).sort()
  const ruKeys = Object.keys(ruJson).sort()
  const missingInRu = enKeys.filter((key) => !ruKeys.includes(key))
  const missingInEn = ruKeys.filter((key) => !enKeys.includes(key))

  if (missingInRu.length) errors.push(`${ruFile}: missing keys from ${enFile}: ${missingInRu.join(", ")}`)
  if (missingInEn.length) errors.push(`${enFile}: missing keys from ${ruFile}: ${missingInEn.join(", ")}`)
}

export function validateProject() {
  const errors = []

  assertExists(SOURCE_MANIFEST, "source", errors)
  assertExists(SOURCE_HTML, "source", errors)
  assertExists(SOURCE_CSS, "source", errors)

  const manifest = readJson(SOURCE_MANIFEST, errors)
  if (manifest) {
    Object.values(manifest.icons || {}).forEach((iconPath) => {
      assertExists(iconPath, "manifest.icons", errors)
    })

    if (manifest.default_locale) {
      assertExists(`_locales/${manifest.default_locale}/messages.json`, "manifest.default_locale", errors)
    }
  }

  if (exists(SOURCE_HTML)) {
    const html = fs.readFileSync(path.join(rootDir, SOURCE_HTML), "utf8")
    collectHtmlRefs(html).forEach((ref) => assertExists(ref, SOURCE_HTML, errors))
  }

  if (exists(SOURCE_CSS)) {
    const css = fs.readFileSync(path.join(rootDir, SOURCE_CSS), "utf8")
    collectCssRefs(css).forEach((ref) => assertExists(ref, SOURCE_CSS, errors))
  }

  compareLocaleKeys(errors)

  return errors
}

function walkDirectory(directoryPath, callback) {
  if (!fs.existsSync(directoryPath)) return
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name)
    if (entry.isDirectory()) {
      walkDirectory(entryPath, callback)
    } else {
      callback(entryPath)
    }
  }
}

export function validateDist(distRoot = path.join(rootDir, "dist")) {
  const errors = []
  if (!fs.existsSync(distRoot)) return errors

  for (const browser of ["chrome", "firefox"]) {
    const browserDir = path.join(distRoot, browser)
    if (!fs.existsSync(browserDir)) continue

    for (const excluded of EXCLUDED_PACKAGE_ENTRIES) {
      if (fs.existsSync(path.join(browserDir, excluded))) {
        errors.push(`${toPosix(path.relative(rootDir, browserDir))}: forbidden packaged entry ${excluded}`)
      }
    }

    walkDirectory(browserDir, (filePath) => {
      const relativeToBrowser = toPosix(path.relative(browserDir, filePath))
      if (relativeToBrowser.startsWith("site/") || relativeToBrowser === "server.js") {
        errors.push(`${toPosix(path.relative(rootDir, filePath))}: forbidden package file`)
      }
    })
  }

  return errors
}

function runCli() {
  const errors = [...validateProject(), ...validateDist()]
  if (errors.length) {
    console.error("Extension validation failed:")
    errors.forEach((error) => console.error(`- ${error}`))
    process.exit(1)
  }
  console.log("Extension validation passed.")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli()
}
