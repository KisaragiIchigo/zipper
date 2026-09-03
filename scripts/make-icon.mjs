// アプリアイコンを生成する。project_style.json のアクセント色を土台に、
// 書庫（フタつきの箱）を正面から見た形を描く。外部の画像ツールに依存しない。
import { deflateSync } from 'node:zlib'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'build')

/** ICO に収める大きさ。Windows は場面ごとに近い寸法を選ぶ */
const SIZES = [16, 24, 32, 48, 64, 128, 256]

// project_style.json の accent と accent_hover
const ACCENT_TOP = [0, 120, 212]
const ACCENT_BOTTOM = [0, 82, 158]
const SURFACE = [255, 255, 255]

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let value = i
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[i] = value >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // ビット深度
  header[9] = 6 // RGBA
  header[10] = 0
  header[11] = 0
  header[12] = 0

  // 各行の先頭にフィルタ種別を置く。ここでは無変換で通す
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/** 0..1 の位置で 2 色を混ぜる */
function mix(from, to, ratio) {
  return [
    Math.round(from[0] + (to[0] - from[0]) * ratio),
    Math.round(from[1] + (to[1] - from[1]) * ratio),
    Math.round(from[2] + (to[2] - from[2]) * ratio)
  ]
}

/** 角丸正方形の内側なら true。座標は 0..1 に正規化した値で受ける */
function insideRoundedSquare(x, y, margin, radius) {
  const left = margin
  const right = 1 - margin
  if (x < left || x > right || y < left || y > right) return false

  const dx = Math.max(left + radius - x, 0, x - (right - radius))
  const dy = Math.max(left + radius - y, 0, y - (right - radius))
  return dx * dx + dy * dy <= radius * radius
}

/**
 * 書庫の形。フタと本体を離して置き、本体の上端に留め具の切り欠きを作る。
 * 面が続いていると単なる矩形に見えてしまうため、隙間で二段だと分からせる。
 */
function insideBox(x, y) {
  const lid = { top: 0.29, bottom: 0.375, left: 0.2, right: 0.8 }
  const body = { top: 0.42, bottom: 0.74, left: 0.25, right: 0.75 }
  const clasp = { left: 0.445, right: 0.555, bottom: 0.545 }

  if (y >= lid.top && y <= lid.bottom) {
    return x >= lid.left && x <= lid.right
  }

  if (y >= body.top && y <= body.bottom) {
    if (x < body.left || x > body.right) return false
    // 留め具はフタから続く錠前に見せたいので、上端から食い込ませる
    if (x >= clasp.left && x <= clasp.right && y <= clasp.bottom) return false
    return true
  }

  return false
}

/** 縁の階段を消すため、1 画素を格子状に分けて平均を取る */
const SUPERSAMPLE = 4

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4)
  const margin = 0.055
  const radius = 0.18

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let coverage = 0
      let boxCoverage = 0
      let gradient = 0

      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const px = (x + (sx + 0.5) / SUPERSAMPLE) / size
          const py = (y + (sy + 0.5) / SUPERSAMPLE) / size

          if (insideRoundedSquare(px, py, margin, radius)) {
            coverage += 1
            gradient += py
            if (insideBox(px, py)) boxCoverage += 1
          }
        }
      }

      const samples = SUPERSAMPLE * SUPERSAMPLE
      const offset = (y * size + x) * 4
      if (coverage === 0) continue

      const base = mix(ACCENT_TOP, ACCENT_BOTTOM, gradient / coverage)
      const boxRatio = boxCoverage / coverage
      const color = mix(base, SURFACE, boxRatio)

      rgba[offset] = color[0]
      rgba[offset + 1] = color[1]
      rgba[offset + 2] = color[2]
      rgba[offset + 3] = Math.round((coverage / samples) * 255)
    }
  }
  return rgba
}

/** PNG をそのまま収める ICO。Vista 以降はこの形式を読める */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  const entries = []
  let offset = 6 + images.length * 16

  for (const image of images) {
    const entry = Buffer.alloc(16)
    // 256 は 0 として記録する取り決め
    entry[0] = image.size >= 256 ? 0 : image.size
    entry[1] = image.size >= 256 ? 0 : image.size
    entry[2] = 0
    entry[3] = 0
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(image.data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += image.data.length
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)])
}

/** スパースパッケージが要求するロゴ。名前と一辺の組 */
const PACKAGE_LOGOS = [
  ['StoreLogo.png', 50],
  ['Square44x44Logo.png', 44],
  ['Square150x150Logo.png', 150]
]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(join(ROOT, 'packaging', 'Assets'), { recursive: true })

  for (const [name, size] of PACKAGE_LOGOS) {
    await writeFile(join(ROOT, 'packaging', 'Assets', name), encodePng(size, renderIcon(size)))
  }

  const images = SIZES.map((size) => ({ size, data: encodePng(size, renderIcon(size)) }))
  await writeFile(join(OUT_DIR, 'icon.ico'), buildIco(images))

  const largest = images[images.length - 1]
  await writeFile(join(OUT_DIR, 'icon.png'), largest.data)

  console.log('build/icon.ico を生成しました（' + SIZES.join(', ') + ' px）')
  console.log('build/icon.png を生成しました（256 px）')
  console.log('packaging/Assets に ' + PACKAGE_LOGOS.map((logo) => logo[0]).join(', ') + ' を生成しました')
}

main().catch((error) => {
  console.error('失敗しました: ' + (error instanceof Error ? error.message : String(error)))
  process.exitCode = 1
})
