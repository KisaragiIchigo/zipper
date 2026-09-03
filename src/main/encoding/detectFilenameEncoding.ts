import iconv from 'iconv-lite'
import { CODEPAGE_LABELS } from '@shared/codepages'
import type { Codepage, FilenameEncoding } from '@shared/types'
import { scoreDecoded } from './scoreDecoded'

const CANDIDATES = [932, 949, 936, 950] as const satisfies readonly Codepage[]

/**
 * システム既定と一致する候補へ与える下駄。
 * 得点が拮抗したときは、利用者の環境で作られた書庫である公算が高いほうを採る。
 */
const SYSTEM_BONUS = 0.4

function isAscii(bytes: Uint8Array): boolean {
  return bytes.every((byte) => byte < 0x80)
}

function isStrictUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return true
  } catch {
    return false
  }
}

function decodeAll(names: readonly Uint8Array[], codepage: Codepage): string {
  return names.map((bytes) => iconv.decode(Buffer.from(bytes), `cp${codepage}`)).join('\n')
}

/**
 * ファイル名の生バイト列からコードページを推定する。
 *
 * 同じバイト列が複数のコードページで妥当に解釈できてしまうため、完全な自動判定は原理的に不可能。
 * よくある場合に強いヒューリスティックに留め、外したときは利用者が手動で切り替えられるようにする。
 */
export function detectFilenameEncoding(
  names: readonly Uint8Array[],
  systemCodepage: Codepage = 932
): FilenameEncoding {
  const nonAscii = names.filter((bytes) => !isAscii(bytes))

  // ASCII だけなら、どのコードページで読んでも結果は同じ
  if (nonAscii.length === 0) {
    return { codepage: 65001, label: CODEPAGE_LABELS[65001], confidence: 1, detected: true }
  }

  if (nonAscii.every(isStrictUtf8)) {
    return { codepage: 65001, label: CODEPAGE_LABELS[65001], confidence: 0.95, detected: true }
  }

  const ranked = CANDIDATES.map((codepage) => {
    const base = scoreDecoded(decodeAll(nonAscii, codepage))
    return { codepage, score: codepage === systemCodepage ? base + SYSTEM_BONUS : base }
  }).sort((a, b) => b.score - a.score)

  const best = ranked[0]
  const runnerUp = ranked[1]
  if (best === undefined) {
    return {
      codepage: systemCodepage,
      label: CODEPAGE_LABELS[systemCodepage],
      confidence: 0,
      detected: true
    }
  }

  // 2 位との開きをそのまま確信度にする。僅差なら手動切り替えを促したい
  const margin = runnerUp === undefined ? best.score : best.score - runnerUp.score
  const confidence = Math.max(0, Math.min(1, margin / 4))

  return {
    codepage: best.codepage,
    label: CODEPAGE_LABELS[best.codepage],
    confidence,
    detected: true
  }
}
