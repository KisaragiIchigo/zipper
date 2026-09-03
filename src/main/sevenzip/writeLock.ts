/**
 * いま書き換えている書庫の場所。
 *
 * 窓を複数開けるようになったため、同じ書庫を 2 か所から同時に書き換えられる。
 * 7-Zip は書庫を作り直す形で書き換えるので、重なると中身が壊れる。
 */
const writing = new Set<string>()

/** 区切り文字。ソース上で連続すると読み違えやすいため定数にする */
const BACKSLASH = String.fromCharCode(92)

/** 大文字と小文字、区切りの違いで別物と見なさない */
function normalize(path: string): string {
  return path.split(BACKSLASH).join('/').toLowerCase()
}

/** 書き込みの権利を取る。すでに誰かが書いていれば false */
export function acquireWrite(path: string): boolean {
  const key = normalize(path)
  if (writing.has(key)) return false

  writing.add(key)
  return true
}

/** 書き込みを終える。取れなかった場合は呼ばない */
export function releaseWrite(path: string): void {
  writing.delete(normalize(path))
}
