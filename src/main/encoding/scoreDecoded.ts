/**
 * デコード結果が「日本語・中国語・韓国語のファイル名として自然か」を採点する。
 *
 * 誤ったコードページで読むと特徴的な崩れ方をすることが実測で分かっている。
 * ・韓国語や中国語を cp932 で読む → 半角カナが大量に並ぶ
 * ・日本語のカタカナを cp936 で読む → U+50xx 台の異体字漢字に密集する
 * ・どのコードページでも表せないバイトは U+FFFD になる
 * この 3 つを減点し、その言語らしい文字を加点する。
 */

const REPLACEMENT = -20
const PRIVATE_USE = -20
const HALFWIDTH_KANA = -6
const KANA = 4
const HANGUL = 4
const CJK = 1
const CJK_COMPAT = -2
const FULLWIDTH = 1
const LATIN_EXTENDED = -4

/** 密集ペナルティを有効にする最小の漢字数。少数では分散を測れない */
const CLUSTER_MIN = 4
/** 上位バイトの種類数がこの比率を下回ると誤読を疑う */
const CLUSTER_THRESHOLD = 0.5
const CLUSTER_WEIGHT = 12

function weightOf(code: number): number | null {
  if (code < 0x80) return null // ASCII は中立。どのコードページでも同じに読めるため判定に使わない
  if (code === 0xfffd) return REPLACEMENT
  if (code >= 0xe000 && code <= 0xf8ff) return PRIVATE_USE
  if (code >= 0xff61 && code <= 0xff9f) return HALFWIDTH_KANA
  if (code >= 0x3041 && code <= 0x3096) return KANA
  if (code >= 0x30a1 && code <= 0x30fa) return KANA
  if (code === 0x30fb || code === 0x30fc) return 2
  if (code >= 0xac00 && code <= 0xd7a3) return HANGUL
  if (code >= 0x3130 && code <= 0x318f) return 1
  if (code >= 0xf900 && code <= 0xfaff) return CJK_COMPAT
  if (code >= 0x4e00 && code <= 0x9fff) return CJK
  if (code >= 0x3400 && code <= 0x4dbf) return CJK_COMPAT
  if (code >= 0x3000 && code <= 0x303f) return FULLWIDTH
  if (code >= 0xff01 && code <= 0xff5e) return FULLWIDTH
  if (code >= 0x2460 && code <= 0x24ff) return 1 // 丸数字などの機種依存文字
  if (code >= 0x00a1 && code <= 0x024f) return LATIN_EXTENDED
  return 0
}

/**
 * 漢字のコードポイントが狭い範囲へ固まっているほど減点する。
 * 正しく読めた文章の漢字は Unicode 上に散らばるが、
 * 誤読でできた異体字の列は上位バイトが揃うという性質を使う。
 */
function clusterPenalty(cjkCodes: readonly number[]): number {
  if (cjkCodes.length < CLUSTER_MIN) return 0
  const highBytes = new Set(cjkCodes.map((code) => code >> 8))
  const ratio = highBytes.size / cjkCodes.length
  if (ratio >= CLUSTER_THRESHOLD) return 0
  return -CLUSTER_WEIGHT * cjkCodes.length * (CLUSTER_THRESHOLD - ratio)
}

/** 非 ASCII 文字 1 個あたりの平均得点を返す。非 ASCII が無ければ 0 */
export function scoreDecoded(text: string): number {
  let total = 0
  let counted = 0
  const cjkCodes: number[] = []

  for (const char of text) {
    const code = char.codePointAt(0)
    if (code === undefined) continue

    const weight = weightOf(code)
    if (weight === null) continue

    total += weight
    counted += 1
    if (code >= 0x4e00 && code <= 0x9fff) cjkCodes.push(code)
  }

  if (counted === 0) return 0
  return (total + clusterPenalty(cjkCodes)) / counted
}
