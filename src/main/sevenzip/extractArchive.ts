import type { OverwriteMode, TaskProgress } from '@shared/types'
import { applyRenames, type RenamePlan } from './applyRenames'
import { buildEntryArguments } from './entryList'
import { ArchiveFailure } from './ArchiveFailure'
import { classifyFailure } from './classifyFailure'
import { createProgressReporter } from './progressReporter'
import { resolveSevenZipPath } from './resolveBinary'
import { runSevenZip } from './runSevenZip'
import { resolveFirstVolume } from './volumeSets'

export interface ExtractOptions {
  destination: string
  /** 未指定または空なら書庫全体を展開する。値は 7-Zip 側の名前 */
  entries?: readonly string[]
  /** 展開後に適用する名前の補正 */
  renames?: readonly RenamePlan[]
  /** 同名ファイルがあったときの扱い。未指定なら上書き */
  overwrite?: OverwriteMode
  password?: string
  /** 取り出さないファイル名。7-Zip のパターン記法をそのまま渡す */
  exclude?: readonly string[]
  onProgress?: (progress: TaskProgress) => void
  /** 全体の件数。進捗の表示に使う */
  total?: number
  signal?: AbortSignal
}

/** 展開中は出力が続く。これは「無応答が続いた時間」の上限 */
const IDLE_TIMEOUT_MS = 60_000

/** 実測で -y より優先される。既存ファイルの扱いはこの指定で確定する */
const OVERWRITE_FLAGS: Record<OverwriteMode, string> = {
  overwrite: '-aoa',
  skip: '-aos',
  rename: '-aou'
}

/**
 * 書庫を展開する。
 * ディレクトリ構造を保つ x コマンドを使い、-spd で名前のワイルドカード解釈を止める。
 * これを付けないと [ ] を含むファイル名がパターンとして扱われ、取り出せない。
 */
export async function extractArchive(
  requestedPath: string,
  options: ExtractOptions
): Promise<void> {
  // 続きの巻を指定されても、先頭から読めば全体が取り出せる
  const path = await resolveFirstVolume(requestedPath)
  const binary = resolveSevenZipPath()
  const mode = options.overwrite ?? 'overwrite'
  const args = ['x', path, '-o' + options.destination, '-y', OVERWRITE_FLAGS[mode], '-bsp1', '-bb1', '-spd']

  if (options.password !== undefined) args.push('-p' + options.password)
  // r を付けると階層の途中にあるものも外れる
  for (const pattern of options.exclude ?? []) args.push('-xr!' + pattern)

  // 数千件を選ぶとコマンドラインの長さの上限に当たるため、一覧はファイル経由になることがある
  const entryArgs = await buildEntryArguments(options.entries ?? [])
  args.push(...entryArgs.args)

  const result = await runSevenZip(binary, args, {
    timeoutMs: IDLE_TIMEOUT_MS,
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    onStdout: createProgressReporter({
      ...(options.total === undefined ? {} : { total: options.total }),
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress })
    })
  }).finally(() => entryArgs.cleanup())

  if (result.code !== 0) {
    throw new ArchiveFailure(
      classifyFailure(result.stdout + result.stderr, options.password !== undefined)
    )
  }

  if (options.renames !== undefined && options.renames.length > 0) {
    await applyRenames(options.destination, options.renames, mode)
  }
}
