import iconv from 'iconv-lite'
import type { Codepage } from '@shared/types'
import { scoreDecoded } from './scoreDecoded'

const CANDIDATES = [932, 949, 936, 950] as const satisfies readonly Codepage[]

export interface DecodedText {
  text: string
  /** 表示に使った文字コードの名前 */
  encoding: string
}

/** 先頭のバイト並びで文字コードが確定する場合 */
function readByOrderMark(buffer: Buffer): DecodedText | null {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return { text: buffer.subarray(3).toString('utf8'), encoding: 'UTF-8 (BOM)' }
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return { text: buffer.subarray(2).toString('utf16le'), encoding: 'UTF-16 LE' }
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    // Node は UTF-16BE を直接扱えないため、2 バイトずつ入れ替えて読む
    const swapped = Buffer.from(buffer.subarray(2))
    swapped.swap16()
    return { text: swapped.toString('utf16le'), encoding: 'UTF-16 BE' }
  }
  return null
}

function isStrictUtf8(buffer: Buffer): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    return true
  } catch {
    return false
  }
}

/**
 * テキストファイルの中身を、文字コードを推定しながら読む。
 * ファイル名の推定と同じ採点を使い、誤読で崩れた並びを避ける。
 */
export function decodeText(buffer: Buffer, systemCodepage: Codepage = 932): DecodedText {
  const marked = readByOrderMark(buffer)
  if (marked !== null) return marked

  if (isStrictUtf8(buffer)) return { text: buffer.toString('utf8'), encoding: 'UTF-8' }

  const ranked = CANDIDATES.map((codepage) => {
    const text = iconv.decode(buffer, 'cp' + codepage)
    const score = scoreDecoded(text.slice(0, 4000))
    return { codepage, text, score: codepage === systemCodepage ? score + 0.4 : score }
  }).sort((a, b) => b.score - a.score)

  const best = ranked[0]
  if (best === undefined) return { text: buffer.toString('utf8'), encoding: 'UTF-8' }
  return { text: best.text, encoding: 'cp' + best.codepage }
}
