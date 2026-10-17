// Rasterises the All Ears mark into the PNGs a PWA install prompt needs, and writes the
// SVG icon. Two notes and the leap between them: vermilion low, cobalt high, joined by
// an ink slur, on Triad Trainer's paper. Same shapes as the mark in Header.svelte
// (24-unit grid). Drawn with signed distances, so it needs no SVG renderer and no
// dependency.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const PAPER = [0xf5, 0xec, 0xda]
const INK = [0x2b, 0x25, 0x20]
const DO = [0xc9, 0x3c, 0x25]
const SO = [0x2a, 0x6a, 0xa8]

const LOW = [6.5, 16.5]
const HIGH = [17.5, 7.5]
const NOTE_R = 4.4
// The slur is the upper-left quarter of a circle round (17.5, 16.5), 1.8 wide.
const ARC_C = [17.5, 16.5]
const ARC_R = 11
const ARC_HALF = 0.9
// Centre and span of the mark, for scaling it into the icon.
const CX = 12
const CY = 11
const SPAN = 20

function slurDistance(x, y) {
  const dx = x - ARC_C[0]
  const dy = y - ARC_C[1]
  if (dx <= 0 && dy <= 0) return Math.abs(Math.hypot(dx, dy) - ARC_R) - ARC_HALF
  const ends = [
    [ARC_C[0] - ARC_R, ARC_C[1]],
    [ARC_C[0], ARC_C[1] - ARC_R],
  ]
  return Math.min(...ends.map(([ex, ey]) => Math.hypot(x - ex, y - ey))) - ARC_HALF
}

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

/** `fraction` is how much of the icon the mark spans. */
function png(size, fraction) {
  const scale = (size * fraction) / SPAN
  const row = size * 3 + 1
  const raw = Buffer.alloc(row * size)

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5 - size / 2) / scale + CX
      const y = (py + 0.5 - size / 2) / scale + CY
      let colour = PAPER
      for (const [dist, ink] of [
        [slurDistance(x, y), INK],
        [Math.hypot(x - LOW[0], y - LOW[1]) - NOTE_R, DO],
        [Math.hypot(x - HIGH[0], y - HIGH[1]) - NOTE_R, SO],
      ]) {
        // One pixel of anti-aliasing at the edge.
        const cover = Math.min(1, Math.max(0, 0.5 - dist * scale))
        if (cover) colour = colour.map((c, i) => Math.round(c + (ink[i] - c) * cover))
      }
      const at = py * row + 1 + px * 3
      raw[at] = colour[0]
      raw[at + 1] = colour[1]
      raw[at + 2] = colour[2]
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

// Full-bleed paper with the mark in the middle 60%, so a launcher's circular crop never
// clips it. The maskable icon shrinks it a little further into the safe zone.
const targets = [
  ['static/icon-192.png', 192, 0.6],
  ['static/icon-512.png', 512, 0.6],
  ['static/icon-maskable-512.png', 512, 0.5],
]

for (const [path, size, fraction] of targets) {
  writeFileSync(path, png(size, fraction))
  console.log('wrote', path)
}

writeFileSync(
  'static/icon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="#f5ecda"/>
  <g transform="translate(12 12) scale(0.72) translate(-${CX} -${CY})">
    <path d="M6.5 16.5 A11 11 0 0 1 17.5 5.5" fill="none" stroke="#2b2520" stroke-width="1.8"/>
    <circle cx="6.5" cy="16.5" r="4.4" fill="#c93c25"/>
    <circle cx="17.5" cy="7.5" r="4.4" fill="#2a6aa8"/>
  </g>
</svg>
`,
)
console.log('wrote static/icon.svg')
