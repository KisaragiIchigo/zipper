import { open } from 'node:fs/promises'

export interface ZipNameEntry {
  /** ファイル名の生バイト列。デコードは呼び出し側の責務 */
  raw: Uint8Array
  /** 汎用フラグ bit 11（EFS）。立っていればファイル名は UTF-8 と規定されている */
  utf8: boolean
}

const EOCD_SIGNATURE = 0x06054b50
const EOCD64_LOCATOR_SIGNATURE = 0x07064b50
const EOCD64_SIGNATURE = 0x06064b50
const CENTRAL_HEADER_SIGNATURE = 0x02014b50

const EOCD_SIZE = 22
const EOCD64_LOCATOR_SIZE = 20
const MAX_COMMENT_SIZE = 0xffff
const ZIP64_MARKER_32 = 0xffffffff
const ZIP64_MARKER_16 = 0xffff

interface Directory {
  offset: number
  size: number
}

function findEocd(tail: Buffer): number {
  // コメント長は可変なので、末尾側から署名を探す
  for (let i = tail.length - EOCD_SIZE; i >= 0; i--) {
    if (tail.readUInt32LE(i) === EOCD_SIGNATURE) return i
  }
  return -1
}

async function locateDirectory(
  handle: Awaited<ReturnType<typeof open>>,
  fileSize: number
): Promise<Directory | null> {
  const tailSize = Math.min(fileSize, EOCD_SIZE + MAX_COMMENT_SIZE + EOCD64_LOCATOR_SIZE)
  const tailStart = fileSize - tailSize
  const tail = Buffer.alloc(tailSize)
  await handle.read(tail, 0, tailSize, tailStart)

  const eocdIndex = findEocd(tail)
  if (eocdIndex < 0) return null

  const entryCount = tail.readUInt16LE(eocdIndex + 10)
  const size = tail.readUInt32LE(eocdIndex + 12)
  const offset = tail.readUInt32LE(eocdIndex + 16)

  const needsZip64 =
    offset === ZIP64_MARKER_32 || size === ZIP64_MARKER_32 || entryCount === ZIP64_MARKER_16
  if (!needsZip64) return { offset, size }

  const locatorIndex = eocdIndex - EOCD64_LOCATOR_SIZE
  if (locatorIndex < 0 || tail.readUInt32LE(locatorIndex) !== EOCD64_LOCATOR_SIGNATURE) return null

  const eocd64Offset = Number(tail.readBigUInt64LE(locatorIndex + 8))
  const eocd64 = Buffer.alloc(56)
  await handle.read(eocd64, 0, 56, eocd64Offset)
  if (eocd64.readUInt32LE(0) !== EOCD64_SIGNATURE) return null

  return {
    size: Number(eocd64.readBigUInt64LE(40)),
    offset: Number(eocd64.readBigUInt64LE(48))
  }
}

/**
 * ZIP のセントラルディレクトリからファイル名の生バイト列を取り出す。
 *
 * 7-Zip はファイル名をシステムのコードページで解釈した「後」の文字列しか返さないため、
 * 誤ったコードページで読まれた時点で元の情報が失われる。
 * エンコーディングを推定するには、ここで生バイト列そのものを得る必要がある。
 *
 * ZIP として読めなかった場合は null を返し、呼び出し側は 7-Zip の結果をそのまま使う。
 */
export async function readZipFilenames(path: string): Promise<ZipNameEntry[] | null> {
  let handle: Awaited<ReturnType<typeof open>> | null = null

  try {
    handle = await open(path, 'r')
    const { size: fileSize } = await handle.stat()
    if (fileSize < EOCD_SIZE) return null

    const directory = await locateDirectory(handle, fileSize)
    if (directory === null || directory.size <= 0) return null
    if (directory.offset + directory.size > fileSize) return null

    const buffer = Buffer.alloc(directory.size)
    await handle.read(buffer, 0, directory.size, directory.offset)

    const entries: ZipNameEntry[] = []
    let cursor = 0

    while (cursor + 46 <= buffer.length) {
      if (buffer.readUInt32LE(cursor) !== CENTRAL_HEADER_SIGNATURE) break

      const flags = buffer.readUInt16LE(cursor + 8)
      const nameLength = buffer.readUInt16LE(cursor + 28)
      const extraLength = buffer.readUInt16LE(cursor + 30)
      const commentLength = buffer.readUInt16LE(cursor + 32)
      const nameStart = cursor + 46

      if (nameStart + nameLength > buffer.length) break

      entries.push({
        raw: Uint8Array.prototype.slice.call(buffer, nameStart, nameStart + nameLength),
        utf8: (flags & 0x0800) !== 0
      })

      cursor = nameStart + nameLength + extraLength + commentLength
    }

    return entries.length > 0 ? entries : null
  } catch {
    return null
  } finally {
    await handle?.close()
  }
}
