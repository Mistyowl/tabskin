import fs from "node:fs/promises"
import fsSync from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { validateProject } from "./validate-extension-assets.mjs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
const { ZipArchive } = require("archiver")

const rootDir = path.resolve(__dirname, "..")
const artifactsDir = path.join(rootDir, "artifacts")

const ROOT_FILES = [
  "manifest.json",
  "index.html",
  "script.js",
  "style.css",
  "package.json",
  "package-lock.json",
]

const ROOT_DIRS = ["_locales", "assets"]

const SCRIPT_FILES = [
  "scripts/build-extension.mjs",
  "scripts/validate-extension-assets.mjs",
]

const README_SOURCE = "SOURCE_CODE_README.md"
const README_IN_ARCHIVE = "README.md"

async function readVersion() {
  const manifest = JSON.parse(await fs.readFile(path.join(rootDir, "manifest.json"), "utf8"))
  return manifest.version
}

async function assertSourceFilesPresent() {
  const missing = []

  for (const file of [...ROOT_FILES, README_SOURCE, ...SCRIPT_FILES]) {
    try {
      await fs.access(path.join(rootDir, file))
    } catch {
      missing.push(file)
    }
  }

  for (const dir of ROOT_DIRS) {
    try {
      const stat = await fs.stat(path.join(rootDir, dir))
      if (!stat.isDirectory()) missing.push(`${dir}/ (not a directory)`)
    } catch {
      missing.push(`${dir}/`)
    }
  }

  if (missing.length) {
    throw new Error(`Missing source files for Firefox source archive:\n${missing.map((f) => `- ${f}`).join("\n")}`)
  }
}

async function createSourceZip(version) {
  await fs.mkdir(artifactsDir, { recursive: true })
  const archivePath = path.join(artifactsDir, `tabskin-firefox-source-v${version}.zip`)
  await fs.rm(archivePath, { force: true })

  const readme = await fs.readFile(path.join(rootDir, README_SOURCE), "utf8")

  await new Promise((resolve, reject) => {
    const output = fsSync.createWriteStream(archivePath)
    const archive = new ZipArchive({ zlib: { level: 9 } })

    output.on("close", resolve)
    archive.on("error", reject)
    archive.pipe(output)

    archive.append(readme, { name: README_IN_ARCHIVE })

    for (const file of ROOT_FILES) {
      archive.file(path.join(rootDir, file), { name: file })
    }

    for (const file of SCRIPT_FILES) {
      archive.file(path.join(rootDir, file), { name: file })
    }

    for (const dir of ROOT_DIRS) {
      archive.directory(path.join(rootDir, dir), dir)
    }

    archive.finalize()
  })

  return archivePath
}

async function main() {
  const errors = validateProject()
  if (errors.length) {
    throw new Error(`Source validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`)
  }

  await assertSourceFilesPresent()
  const version = await readVersion()
  const archivePath = await createSourceZip(version)

  console.log(`Built Firefox source archive: ${path.relative(rootDir, archivePath)}`)
  console.log("Upload this zip to AMO as the extension source code.")
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
