import { access } from 'node:fs/promises'

/**
 * 分割書庫は先頭の巻を渡せば全体が読まれる。
 *
 * 続きの巻をそのまま渡しても 7-Zip は中身を読めないため、先頭へ読み替える。
 * まとめて選ばれた場合は、読み替えた結果が同じものを 1 つにまとめて重複を防ぐ。
 */

/** name.part2.rar / name.part02.rar のような RAR の分割 */
const RAR_PART = /^(.*\.part)(\d+)(\.rar)$/i
/** name.7z.002 / name.zip.010 のような連番 */
const NUMBERED_VOLUME = /^(.*)\.(\d{3,})$/

/** 連番の桁数を保ったまま先頭の番号にする */
function firstNumber(width: number): string {
  return '1'.padStart(width, '0')
}

/**
 * 続きの巻なら、先頭の巻のパスを返す。
 * 先頭そのものや、分割でないものは null を返す。
 */
export function firstVolumeOf(path: string): string | null {
  const rar = RAR_PART.exec(path)
  if (rar?.[1] !== undefined && rar[2] !== undefined && rar[3] !== undefined) {
    if (Number(rar[2]) === 1) return null
    return rar[1] + firstNumber(rar[2].length) + rar[3]
  }

  const numbered = NUMBERED_VOLUME.exec(path)
  if (numbered?.[1] !== undefined && numbered[2] !== undefined) {
    if (Number(numbered[2]) === 1) return null
    return numbered[1] + '.' + firstNumber(numbered[2].length)
  }

  return null
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * 続きの巻を選んでいた場合、先頭の巻へ読み替える。
 * 先頭が見当たらないときは、そのまま返して 7-Zip の判断に委ねる。
 */
export async function resolveFirstVolume(path: string): Promise<string> {
  const first = firstVolumeOf(path)
  if (first === null) return path
  return (await exists(first)) ? first : path
}

/** まとめて選ばれたものを、それぞれ先頭の巻へ読み替えて重複を除く */
export async function resolveVolumeSets(paths: readonly string[]): Promise<string[]> {
  const resolved = await Promise.all(paths.map((path) => resolveFirstVolume(path)))

  const seen = new Set<string>()
  const unique: string[] = []
  for (const path of resolved) {
    // 大文字小文字だけが違う指定も同じものとして扱う
    const key = path.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(path)
  }
  return unique
}
