import fs from "node:fs/promises"
import fsSync from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"
import { validateDist, validateProject } from "./validate-extension-assets.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
const { ZipArchive } = require("archiver")
const rootDir = path.resolve(__dirname, "..")
const distDir = path.join(rootDir, "dist")
const artifactsDir = path.join(rootDir, "artifacts")

const SUPPORTED_TARGETS = new Set(["all", "chrome", "firefox"])
const SUPPORTED_MODES = new Set(["development", "production"])

function parseArgs(argv) {
  const options = {
    target: "all",
    mode: "production",
    watch: false,
  }

  for (const arg of argv) {
    if (arg.startsWith("--target=")) options.target = arg.split("=")[1]
    if (arg.startsWith("--mode=")) options.mode = arg.split("=")[1]
    if (arg === "--watch") options.watch = true
  }

  if (!SUPPORTED_TARGETS.has(options.target)) {
    throw new Error(`Unsupported target "${options.target}". Use all, chrome, or firefox.`)
  }
  if (!SUPPORTED_MODES.has(options.mode)) {
    throw new Error(`Unsupported mode "${options.mode}". Use development or production.`)
  }

  return options
}

function getTargets(target) {
  return target === "all" ? ["chrome", "firefox"] : [target]
}

async function ensureEmptyDir(directoryPath) {
  await fs.rm(directoryPath, { recursive: true, force: true })
  await fs.mkdir(directoryPath, { recursive: true })
}

async function copyDir(sourceDir, targetDir, filter = () => true) {
  if (!fsSync.existsSync(sourceDir)) return
  await fs.mkdir(targetDir, { recursive: true })
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    const relativePath = path.relative(rootDir, sourcePath).split(path.sep).join("/")
    if (!filter(relativePath, entry)) continue

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath, filter)
    } else {
      await fs.copyFile(sourcePath, targetPath)
    }
  }
}

async function writeManifest(browser, targetDir) {
  const manifest = JSON.parse(await fs.readFile(path.join(rootDir, "manifest.json"), "utf8"))

  if (browser === "firefox") {
    delete manifest.minimum_chrome_version
    manifest.browser_specific_settings = {
      gecko: {
        id: "tabskin@tabskin.ru",
        strict_min_version: "109.0",
      },
    }
  }

  await fs.writeFile(path.join(targetDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest.version
}

async function writeHtml(targetDir) {
  const html = await fs.readFile(path.join(rootDir, "index.html"), "utf8")
  const outputHtml = html.replace(
    /\s*<script\s+src=["']script\.js["']><\/script>\s*<script\s+src=["']assets\/js\/settings\.js["']><\/script>/,
    "\n  <script src=\"app.js\"></script>"
  )
  await fs.writeFile(path.join(targetDir, "index.html"), outputHtml)
}

async function writeJavaScript(targetDir, mode) {
  const isProduction = mode === "production"
  const script = await fs.readFile(path.join(rootDir, "script.js"), "utf8")
  const settings = await fs.readFile(path.join(rootDir, "assets", "js", "settings.js"), "utf8")

  const result = await esbuild.transform(`${script}\n\n${settings}`, {
    loader: "js",
    target: "es2020",
    minify: isProduction,
    sourcemap: isProduction ? false : "external",
    sourcefile: "app.js",
    legalComments: "none",
    drop: isProduction ? ["console", "debugger"] : [],
  })

  await fs.writeFile(path.join(targetDir, "app.js"), result.code)
  if (result.map) {
    await fs.writeFile(path.join(targetDir, "app.js.map"), result.map)
  }
}

async function writeCss(targetDir, mode) {
  const isProduction = mode === "production"
  const css = await fs.readFile(path.join(rootDir, "style.css"), "utf8")
  const result = await esbuild.transform(css, {
    loader: "css",
    minify: isProduction,
    sourcemap: isProduction ? false : "external",
    sourcefile: "style.css",
    legalComments: "none",
  })

  await fs.writeFile(path.join(targetDir, "style.css"), result.code)
  if (result.map) {
    await fs.writeFile(path.join(targetDir, "style.css.map"), result.map)
  }
}

async function copyStaticAssets(targetDir) {
  await copyDir(path.join(rootDir, "_locales"), path.join(targetDir, "_locales"))
  await copyDir(path.join(rootDir, "assets"), path.join(targetDir, "assets"), (relativePath) => {
    return (
      relativePath !== "assets/js" &&
      !relativePath.startsWith("assets/js/") &&
      relativePath !== "assets/overlay.png"
    )
  })
}

async function createZip(browser, version) {
  await fs.mkdir(artifactsDir, { recursive: true })
  const archivePath = path.join(artifactsDir, `tabskin-${browser}-v${version}.zip`)
  await fs.rm(archivePath, { force: true })

  await new Promise((resolve, reject) => {
    const output = fsSync.createWriteStream(archivePath)
    const archive = new ZipArchive({ zlib: { level: 9 } })

    output.on("close", resolve)
    archive.on("error", reject)
    archive.pipe(output)
    archive.directory(path.join(distDir, browser), false)
    archive.finalize()
  })
}

async function buildTarget(browser, mode) {
  const targetDir = path.join(distDir, browser)
  await ensureEmptyDir(targetDir)

  const version = await writeManifest(browser, targetDir)
  await writeHtml(targetDir)
  await writeJavaScript(targetDir, mode)
  await writeCss(targetDir, mode)
  await copyStaticAssets(targetDir)

  if (mode === "production") {
    await createZip(browser, version)
  }
}

async function runBuild({ target, mode }) {
  const sourceErrors = validateProject()
  if (sourceErrors.length) {
    throw new Error(`Source validation failed:\n${sourceErrors.map((error) => `- ${error}`).join("\n")}`)
  }

  const targets = getTargets(target)
  await Promise.all(targets.map((browser) => buildTarget(browser, mode)))

  const distErrors = validateDist()
  if (distErrors.length) {
    throw new Error(`Dist validation failed:\n${distErrors.map((error) => `- ${error}`).join("\n")}`)
  }

  console.log(`Built ${targets.join(", ")} extension package(s) in ${mode} mode.`)
}

function shouldIgnoreWatchEvent(fileName) {
  if (!fileName) return true
  const normalized = fileName.split(path.sep).join("/")
  return (
    normalized.startsWith("site/") ||
    normalized === "server.js" ||
    normalized.startsWith("dist/") ||
    normalized.startsWith("artifacts/") ||
    normalized.startsWith("node_modules/") ||
    normalized.startsWith(".git/")
  )
}

async function runWatch(options) {
  await runBuild(options)
  console.log("Watching extension files...")

  let timer = null
  fsSync.watch(rootDir, { recursive: true }, (_eventType, fileName) => {
    if (shouldIgnoreWatchEvent(fileName)) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      runBuild(options).catch((error) => {
        console.error(error.message)
      })
    }, 150)
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.watch) {
    await runWatch(options)
  } else {
    await runBuild(options)
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
