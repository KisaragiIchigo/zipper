import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * 書庫から一時的に取り出したファイルの置き場。用途ごとに作った順で持つ。
 *
 * 開いたアプリや、渡した先のエクスプローラーがファイルを掴んでいる間は消せない。
 * 終了時にまとめて片付けるほか、用途によっては古いものから先に手放す。
 */
const byPurpose = new Map<string, string[]>()

function discard(paths: readonly string[]): void {
  void Promise.all(paths.map((dir) => rm(dir, { recursive: true, force: true }))).catch(() => {
    // まだ掴まれていて消せないことがある。終了時にもう一度片付ける
  })
}

/**
 * 用途の分かる名前で一時領域を作る。
 *
 * keepRecent を渡すと、その数だけ手前の分を残して古いものを片付ける。
 * 直前に作った分は渡した先がまだ読んでいる可能性があるため、必ず残す。
 */
export async function createTempDirectory(purpose: string, keepRecent?: number): Promise<string> {
  const created = await mkdtemp(join(tmpdir(), 'zipper-' + purpose + '-'))
  const list = byPurpose.get(purpose) ?? []
  list.push(created)

  if (keepRecent !== undefined) {
    const excess = list.length - keepRecent - 1
    if (excess > 0) discard(list.splice(0, excess))
  }

  byPurpose.set(purpose, list)
  return created
}

/** 一時的に取り出したファイルを片付ける。終了時に呼ぶ */
export async function cleanupTempDirectories(): Promise<void> {
  const pending = [...byPurpose.values()].flat()
  byPurpose.clear()
  await Promise.all(pending.map((dir) => rm(dir, { recursive: true, force: true })))
}
