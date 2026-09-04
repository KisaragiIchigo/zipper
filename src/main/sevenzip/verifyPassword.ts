import type { ArchiveEntry } from '@shared/types'
import { ArchiveFailure } from './ArchiveFailure'
import { classifyFailure } from './classifyFailure'
import { resolveSevenZipPath } from './resolveBinary'
import { runSevenZip } from './runSevenZip'

/** 鍵を確かめるだけなので、展開ほどの猶予は要らない */
const IDLE_TIMEOUT_MS = 60_000

/**
 * 鍵の確認に使う 1 件を選ぶ。
 *
 * 復号を伴う項目なら、鍵の正否はどれを読んでも同じように出る。
 * 一番小さいものを選べば、確認そのものは一瞬で終わる。
 */
function pickProbe(entries: readonly ArchiveEntry[]): ArchiveEntry | null {
  let smallest: ArchiveEntry | null = null

  for (const entry of entries) {
    if (entry.isDirectory || !entry.encrypted) continue
    if (smallest === null || entry.size < smallest.size) smallest = entry
  }
  return smallest
}

/**
 * 展開を始める前に、鍵が合っているかを確かめる。
 *
 * 7-Zip の x は中身を復号する前に出力ファイルを作るため、鍵が違うと
 * 0 バイトのファイルだけが宛先に残る。t は書き出さずに読むだけなので、
 * 先にこちらを通せば、鍵が違うときに宛先へ何も生まれない。
 *
 * 鍵が要らない書庫では何もしない。ZIP は中身だけを暗号化する作りが多く、
 * 一覧が読めたことは鍵が合っている証しにならないため、この確認が要る。
 */
export async function verifyPassword(
  path: string,
  entries: readonly ArchiveEntry[],
  password: string | undefined
): Promise<void> {
  const probe = pickProbe(entries)
  if (probe === null) return

  const binary = resolveSevenZipPath()
  // -spd で名前のワイルドカード解釈を止める。[ ] を含む名前が拾えなくなるため
  const args = ['t', path, '-spd']
  if (password !== undefined) args.push('-p' + password)
  args.push(probe.sourcePath)

  const result = await runSevenZip(binary, args, { timeoutMs: IDLE_TIMEOUT_MS })
  if (result.code === 0) return

  throw new ArchiveFailure(classifyFailure(result.stdout + result.stderr, password !== undefined))
}
