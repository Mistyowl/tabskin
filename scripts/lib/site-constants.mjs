import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
export const SITE_DIR = path.join(ROOT, "site")
export const SEO_DIR = path.join(SITE_DIR, "seo")
export const BASE_URL = "https://tabskin.ru"
export const OG_IMAGE = "/assets/screenshot-main.webp"
export const OG_IMAGE_WIDTH = 1024
export const OG_IMAGE_HEIGHT = 576
export const LOGO_URL = "/assets/logo.png"
export const GA_ID = "G-6V5H5T6SXV"
export const YM_ID = 103208770
export const THEME_COLOR = "#181825"
