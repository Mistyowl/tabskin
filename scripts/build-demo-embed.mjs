import fs from "node:fs/promises"
import fsSync from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as esbuild from "esbuild"
import { validateProject } from "./validate-extension-assets.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const embedDir = path.join(rootDir, "site", "demo", "embed")

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

function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+(?=<(?:html|head|body|meta|link|title|div|button|svg|use|p|script)\b|<\/(?:html|head|body|div|button|svg|p|script)>)/gi, ">")
    .replace(/(<\/(?:html|head|body|div|button|svg|p|script)>|<(?:html|head|body|meta|link|title|div|button|svg|use|p|script)\b[^>]*>)\s+</gi, "$1<")
    .trim()
}

async function writeHtml(targetDir) {
  const html = await fs.readFile(path.join(rootDir, "index.html"), "utf8")
  const outputHtml = html.replace(
    /\s*<script\s+src=["']script\.js["']><\/script>\s*<script\s+src=["']assets\/js\/settings\.js["']><\/script>/,
    "\n  <script src=\"app.js\"></script>"
  )
  await fs.writeFile(path.join(targetDir, "index.html"), minifyHtml(outputHtml))
}

async function writeJavaScript(targetDir) {
  const script = await fs.readFile(path.join(rootDir, "script.js"), "utf8")
  const settings = await fs.readFile(path.join(rootDir, "assets", "js", "settings.js"), "utf8")

  const result = await esbuild.transform(`${script}\n\n${settings}`, {
    loader: "js",
    target: "es2020",
    minify: true,
    sourcefile: "app.js",
    legalComments: "none",
    drop: ["console", "debugger"],
  })

  await fs.writeFile(path.join(targetDir, "app.js"), result.code)
}

async function writeCss(targetDir) {
  const css = await fs.readFile(path.join(rootDir, "style.css"), "utf8")
  const result = await esbuild.transform(css, {
    loader: "css",
    minify: true,
    sourcefile: "style.css",
    legalComments: "none",
  })

  await fs.writeFile(path.join(targetDir, "style.css"), result.code)
}

async function copyStaticAssets(targetDir) {
  await copyDir(path.join(rootDir, "assets"), path.join(targetDir, "assets"), (relativePath) => {
    return (
      relativePath !== "assets/js" &&
      !relativePath.startsWith("assets/js/") &&
      relativePath !== "assets/overlay.png"
    )
  })
}

function patchEmbedHtml(html) {
  const langScript =
    '<script>(function(){var p=new URLSearchParams(location.search).get("lang");if(p==="ru"||p==="en")document.documentElement.lang=p;})();</script>'
  const headInject =
    '<meta name="robots" content="noindex, nofollow"><base href="/demo/embed/">' + langScript

  return html
    .replace(/<html>/i, "<html lang=\"en\">")
    .replace(/<head>/i, `<head>${headInject}`)
}

async function buildDemoEmbed() {
  const sourceErrors = validateProject()
  if (sourceErrors.length) {
    throw new Error(`Source validation failed:\n${sourceErrors.map((error) => `- ${error}`).join("\n")}`)
  }

  await ensureEmptyDir(embedDir)
  await writeHtml(embedDir)
  await writeJavaScript(embedDir)
  await writeCss(embedDir)
  await copyStaticAssets(embedDir)

  const htmlPath = path.join(embedDir, "index.html")
  const html = await fs.readFile(htmlPath, "utf8")
  await fs.writeFile(htmlPath, patchEmbedHtml(html))

  console.log(`Built demo embed at site/demo/embed/`)
}

buildDemoEmbed().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
