import type { ArchiveEntry } from '@shared/types'
import type { RawEntry } from '../parseListing'

const BACKSLASH = String.fromCharCode(92)

function textOrNull(value: string | undefined): string | null {
  return value === undefined || value === '' ? null : value
}

/** ZIP のディレクトリ名は末尾に / を持つ。7-Zip の一覧と表記を揃える */
function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

/**
 * macOS で作られた書庫は濁点や半濁点を分解した形（NFD）で名前を持つ。
 * そのまま書き出すと Windows では「か゛」のように離れて見えるため、
 * 表示と展開後の名前は合成済みの形（NFC）に揃える。
 */
function normalize(value: string): string {
  return stripTrailingSlash(value.split(BACKSLASH).join('/')).normalize('NFC')
}

/**
 * 7-Zip の出力 1 件分を、表示に使う形へ整える。
 * overrideName はエンコーディングを補正した場合の正しい名前で、
 * 7-Zip 側の名前は展開の指定とリネームに要るため sourcePath として残す。
 */
export function toEntry(raw: RawEntry, overrideName: string | null): ArchiveEntry {
  const sevenZipPath = raw['Path'] ?? ''

  return {
    path: normalize(overrideName ?? sevenZipPath),
    sourcePath: stripTrailingSlash(sevenZipPath.split(BACKSLASH).join('/')),
    isDirectory: raw['Folder'] === '+',
    size: Number(raw['Size'] ?? 0),
    packedSize: Number(raw['Packed Size'] ?? 0),
    modified: textOrNull(raw['Modified']),
    crc: textOrNull(raw['CRC']),
    method: textOrNull(raw['Method']),
    encrypted: raw['Encrypted'] === '+'
  }
}
