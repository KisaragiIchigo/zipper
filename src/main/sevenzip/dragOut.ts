import { join } from 'node:path'
import { extractArchive } from './extractArchive'
import { createTempDirectory } from './tempWorkspace'

export interface DragTarget {
  /** 7-Zip 側の名前。展開の指定に使う */
  entry: string
  /** 展開後にあるべき名前。エンコーディングを補正した書庫では entry と食い違う */
  displayPath: string
}

/**
 * ドラッグして渡すために、選ばれた項目を一時領域へ取り出す。
 *
 * エクスプローラーへ引き渡せるのは実体のあるファイルだけなので、
 * 掴んだ時点で書き出しておく必要がある。
 */
export async function stageForDrag(
  archivePath: string,
  targets: readonly DragTarget[],
  password?: string
): Promise<string[]> {
  if (targets.length === 0) return []

  // 引きずり終わった分はもう読まれない。直前の 1 回だけ残して古いものは手放す
  const destination = await createTempDirectory('drag', 1)
  const renames = targets
    .filter((target) => target.entry !== target.displayPath)
    .map((target) => ({ from: target.entry, to: target.displayPath }))

  await extractArchive(archivePath, {
    destination,
    entries: targets.map((target) => target.entry),
    ...(renames.length === 0 ? {} : { renames }),
    ...(password === undefined ? {} : { password })
  })

  // 取り出したものの最上位だけを渡す。フォルダを選んだ場合は配下も一緒に付いてくる
  const roots = new Set(targets.map((target) => target.displayPath.split('/')[0] ?? ''))
  return [...roots].filter((name) => name !== '').map((name) => join(destination, name))
}
