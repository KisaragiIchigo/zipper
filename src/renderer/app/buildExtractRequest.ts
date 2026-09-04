import type { ArchiveInfo } from '@shared/types'
import type { ExtractRequestInput } from '@/hooks/useExtract'

/**
 * 一覧の選択状態から、展開の要求を組み立てる。
 *
 * 7-Zip へ渡す名前と、利用者に見えている名前は食い違うことがある。
 * 前者は entries と renames、後者は衝突確認に使う outputPaths として、それぞれ別に用意する。
 * 選択が空なら書庫全体を対象とみなす。
 */
export function buildExtractRequest(
  info: ArchiveInfo,
  selected: ReadonlySet<string>,
  password: string | undefined
): ExtractRequestInput {
  // 7-Zip へ渡すのは 7-Zip 自身が認識している名前
  const targets = info.entries
    .filter((entry) => selected.has(entry.path))
    .map((entry) => entry.sourcePath)

  // フォルダを選ぶと配下も一緒に出てくるため、衝突確認の対象もそこまで広げる
  const chosen = [...selected]
  const scope =
    chosen.length === 0
      ? info.entries
      : info.entries.filter((entry) =>
          chosen.some((path) => entry.path === path || entry.path.startsWith(path + '/'))
        )
  const outputPaths = scope.filter((entry) => !entry.isDirectory).map((entry) => entry.path)

  // エンコーディングを補正した書庫では、展開後の名前も一覧に合わせる
  const renames = info.entries
    .filter((entry) => entry.sourcePath !== entry.path)
    .map((entry) => ({ from: entry.sourcePath, to: entry.path }))

  return {
    path: info.path,
    outputPaths,
    ...(targets.length === 0 ? {} : { entries: targets }),
    ...(renames.length === 0 ? {} : { renames }),
    ...(info.hasEncryptedEntry ? { hasEncryptedEntry: true } : {}),
    ...(password === undefined ? {} : { password })
  }
}
