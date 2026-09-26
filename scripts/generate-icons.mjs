// Renders public/favicon.svg into the PNG icons the web app manifest and iOS need:
//   node scripts/generate-icons.mjs
// - icon-192.png / icon-512.png: the favicon as is (rounded square).
// - icon-maskable-512.png: full-bleed background with the glyph inside the 80 % safe
//   zone, so Android can crop it to any shape.
// - apple-touch-icon.png (180): full-bleed too; iOS rounds the corners itself.
import { chromium } from "@playwright/test"
import { readFileSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const svg = readFileSync(path.join(root, "public/favicon.svg"), "utf8")
const outDir = path.join(root, "public/icons")
mkdirSync(outDir, { recursive: true })

// Same gradient and glyph, but a square background and the glyph at `scale` of the size.
const fullBleed = (scale) => {
  const glyph = svg.match(/<path[^>]*\/>/)[0].replace(/transform="[^"]*"/, "")
  const s = (48 * scale) / 24 // the glyph path is drawn on a 24×24 grid
  const offset = (48 - 24 * s) / 2
  return svg
    .replace(/<rect[^>]*\/>/, '<rect width="48" height="48" fill="url(#g)"/>')
    .replace(/<path[^>]*\/>/, glyph.replace("<path", `<path transform="translate(${offset} ${offset}) scale(${s})"`))
}

const icons = [
  { file: "icon-192.png", size: 192, markup: svg },
  { file: "icon-512.png", size: 512, markup: svg },
  { file: "icon-maskable-512.png", size: 512, markup: fullBleed(0.5) },
  { file: "apple-touch-icon.png", size: 180, markup: fullBleed(0.6) },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const { file, size, markup } of icons) {
  const sized = markup.replace(/width="48" height="48"/, `width="${size}" height="${size}"`)
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`)
  await page.screenshot({ path: path.join(outDir, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
  console.log("wrote", path.join("public/icons", file))
}
await browser.close()
