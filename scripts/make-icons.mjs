// Rasterises the flat-rect app mark into the PNGs a PWA install prompt needs.
// The mark is a handful of rectangles, so it needs no SVG renderer — and no dependency.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const BG = [0xf3, 0xf2, 0xf2]
const INK = [0x20, 0x1e, 0x1d]
const ACCENT = [0xec, 0x30, 0x13]

/** Bars as laid out on the 512-unit design grid. */
const BARS = [
  { x: 64, y: 64, w: 384, h: 24, c: INK },
  { x: 64, y: 424, w: 384, h: 24, c: INK },
  { x: 96, y: 160, w: 60, h: 192, c: INK },
  { x: 188, y: 208, w: 60, h: 144, c: INK },
  { x: 280, y: 128, w: 60, h: 224, c: ACCENT },
  { x: 372, y: 240, w: 60, h: 112, c: INK },
]

function crc32(buf) {
  let c = ~0
  for (const byte of buf) {
    c ^= byte
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0)
  return Buffer.concat([head, data, crc])
}

function png(size, scale) {
  const pad = (1 - scale) / 2
  const row = size * 3 + 1
  const raw = Buffer.alloc(row * size)

  for (let y = 0; y < size; y++) {
    const base = y * row
    for (let x = 0; x < size; x++) {
      const at = base + 1 + x * 3
      raw[at] = BG[0]
      raw[at + 1] = BG[1]
      raw[at + 2] = BG[2]
    }
  }

  const place = (v) => Math.round((pad + (v / 512) * scale) * size)
  for (const b of BARS) {
    const x0 = place(b.x)
    const x1 = place(b.x + b.w)
    const y0 = place(b.y)
    const y1 = place(b.y + b.h)
    for (let y = y0; y < y1; y++) {
      const base = y * row
      for (let x = x0; x < x1; x++) {
        const at = base + 1 + x * 3
        raw[at] = b.c[0]
        raw[at + 1] = b.c[1]
        raw[at + 2] = b.c[2]
      }
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const targets = [
  ['static/icon-192.png', 192, 1],
  ['static/icon-512.png', 512, 1],
  // A maskable icon is cropped to a circle, so the mark shrinks into the safe zone.
  ['static/icon-maskable-512.png', 512, 0.72],
]

for (const [path, size, scale] of targets) {
  writeFileSync(path, png(size, scale))
  console.log('wrote', path)
}
