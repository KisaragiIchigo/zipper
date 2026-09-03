import iconv from 'iconv-lite'
import { CODEPAGE_LABELS } from '@shared/codepages'
import type { Codepage, FilenameEncoding } from '@shared/types'
import { detectFilenameEncoding } from '../../encoding/detectFilenameEncoding'
import { scoreDecoded } from '../../encoding/scoreDecoded'
import type { ZipNameEntry } from '../../zip/readZipFilenames'

/** 日本語版 Windows の ANSI コードページ。7-Zip が判定に迷ったとき最後に落ちる先でもある */
export const SYSTEM_CODEPAGE: Codepage = 932

/**
 * 7-Zip が返した名前がこの得点を下回ったら、読み違えを疑って自前判定に諮る。
 * 正常に読めた日本語・中国語・韓国語は 1 以上になり、
 * 他言語を cp932 で誤読して半角カナが並んだ場合は大きく負に振れる。
 */
const SUSPICIOUS_SCORE = 0
/** 自前判定で置き換えるには、7-Zip の結果よりこれだけ明確に上回る必要がある */
const OVERRIDE_MARGIN = 2

export interface NameResolution {
  /** 差し替える名前。7-Zip の結果をそのまま使う場合は null */
  names: string[] | null
  encoding: FilenameEncoding | null
}

const UNRESOLVED: NameResolution = { names: null, encoding: null }

function isAsciiOnly(bytes: Uint8Array): boolean {
  return bytes.every((byte) => byte < 0x80)
}

function manualEncoding(codepage: Codepage): FilenameEncoding {
  return { codepage, label: CODEPAGE_LABELS[codepage], confidence: 1, detected: false }
}

/**
 * ファイル名の生バイト列を指定のコードページで文字列に戻す。
 * EFS フラグ付きのエントリは規格上 UTF-8 と決まっているため、推定結果より優先する。
 */
function decodeName(entry: ZipNameEntry, codepage: Codepage): string {
  if (entry.utf8 || codepage === 65001) {
    return new TextDecoder('utf-8').decode(entry.raw)
  }
  return iconv.decode(Buffer.from(entry.raw), 'cp' + codepage)
}

/**
 * ZIP のファイル名をどう読むかを決める。
 *
 * 7-Zip 26 は EFS フラグの無い ZIP でもコードページを自前で判定し、実測では
 * cp932 / cp936 / cp949 を正しく読み分ける。ただしシステムのコードページで
 * 「一応読めてしまう」バイト列は、それが他言語の書庫であっても cp932 として確定してしまう。
 * そこで 7-Zip の結果を第一とし、明らかに不自然なときだけ自前判定で上書きする。
 */
export function resolveNames(
  entries: readonly ZipNameEntry[],
  sevenZipNames: readonly string[],
  override: Codepage | undefined
): NameResolution {
  if (override !== undefined) {
    return {
      names: entries.map((entry) => decodeName(entry, override)),
      encoding: manualEncoding(override)
    }
  }

  const undecided = entries.filter((entry) => !entry.utf8).map((entry) => entry.raw)
  if (!undecided.some((raw) => !isAsciiOnly(raw))) return UNRESOLVED

  const sevenZipScore = scoreDecoded(sevenZipNames.join(' '))
  if (sevenZipScore >= SUSPICIOUS_SCORE) return UNRESOLVED

  const candidate = detectFilenameEncoding(undecided, SYSTEM_CODEPAGE)
  const decoded = entries.map((entry) => decodeName(entry, candidate.codepage))
  const candidateScore = scoreDecoded(decoded.join(' '))

  if (candidateScore <= sevenZipScore + OVERRIDE_MARGIN) return UNRESOLVED
  return { names: decoded, encoding: candidate }
}
