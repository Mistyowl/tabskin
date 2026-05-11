import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import zlib from "node:zlib"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const iconDir = path.join(rootDir, "assets", "icons")

const sizes = [16, 32, 48, 128]
const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  const checksum = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, checksum])
}

function createIcon(size) {
  const bytesPerPixel = 4
  const stride = size * bytesPerPixel
  const raw = Buffer.alloc((stride + 1) * size)
  const radius = Math.round(size * 0.22)

  for (let y = 0; y < size; y += 1) {
    const rowOffset = y * (stride + 1)
    raw[rowOffset] = 0

    for (let x = 0; x < size; x += 1) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel
      const dx = x < radius ? radius - x : x >= size - radius ? x - (size - radius - 1) : 0
      const dy = y < radius ? radius - y : y >= size - radius ? y - (size - radius - 1) : 0
      const outsideRoundedCorner = dx && dy && dx * dx + dy * dy > radius * radius

      if (outsideRoundedCorner) {
        raw[pixelOffset + 3] = 0
        continue
      }

      const gradient = y / Math.max(size - 1, 1)
      raw[pixelOffset] = Math.round(102 + 70 * gradient)
      raw[pixelOffset + 1] = Math.round(94 + 28 * gradient)
      raw[pixelOffset + 2] = Math.round(220 + 24 * (1 - gradient))
      raw[pixelOffset + 3] = 255

      const barThickness = Math.max(2, Math.round(size * 0.14))
      const topY = Math.round(size * 0.24)
      const topStart = Math.round(size * 0.24)
      const topEnd = Math.round(size * 0.76)
      const stemStart = Math.round(size * 0.5 - barThickness / 2)
      const stemEnd = Math.round(size * 0.5 + barThickness / 2)
      const stemBottom = Math.round(size * 0.74)
      const inTopBar = y >= topY && y < topY + barThickness && x >= topStart && x < topEnd
      const inStem = x >= stemStart && x < stemEnd && y >= topY && y < stemBottom

      if (inTopBar || inStem) {
        raw[pixelOffset] = 255
        raw[pixelOffset + 1] = 255
        raw[pixelOffset + 2] = 255
      }
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

await fs.mkdir(iconDir, { recursive: true })
for (const size of sizes) {
  await fs.writeFile(path.join(iconDir, `icon_${size}x${size}.png`), createIcon(size))
}

console.log(`Generated ${sizes.length} PNG extension icons.`)
