import { access } from 'node:fs/promises'
import { join } from 'node:path'

/** すでに同じ名前のものがある項目を拾う。展開前の確認に使う */
export async function findConflicts(
  destination: string,
  entries: readonly string[]
): Promise<string[]> {
  const conflicts: string[] = []

  for (const entry of entries) {
    try {
      await access(join(destination, entry))
      conflicts.push(entry)
    } catch {
      // 存在しなければ衝突なし
    }
  }
  return conflicts
}
