import type { TaskProgress } from '@shared/types'
import { ArchiveFailure } from './ArchiveFailure'
import { classifyFailure } from './classifyFailure'
import { createProgressReporter } from './progressReporter'
import { resolveSevenZipPath } from './resolveBinary'
import { runSevenZip } from './runSevenZip'

interface ModifyOptions {
  password?: string
  onProgress?: (progress: TaskProgress) => void
  /** 全体の件数。進捗の表示に使う */
  total?: number
  signal?: AbortSignal
}

const IDLE_TIMEOUT_MS = 120_000

async function run(command: readonly string[], options: ModifyOptions): Promise<void> {
  const binary = resolveSevenZipPath()
  const args = [...command, '-bsp1', '-bb1', '-y', '-spd']
  if (options.password !== undefined) args.push('-p' + options.password)

  const result = await runSevenZip(binary, args, {
    timeoutMs: IDLE_TIMEOUT_MS,
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    onStdout: createProgressReporter({
      ...(options.total === undefined ? {} : { total: options.total }),
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress })
    })
  })

  if (result.code !== 0) {
    throw new ArchiveFailure(
      classifyFailure(result.stdout + result.stderr, options.password !== undefined)
    )
  }
}

/**
 * 既存の書庫にファイルを足す。
 * 7-Zip のコマンドでは書庫内の格納先を指定できないため、最上位に入る。
 */
export async function addToArchive(
  path: string,
  sources: readonly string[],
  options: ModifyOptions = {}
): Promise<void> {
  await run(['a', path, ...sources], options)
}

/** 書庫から項目を取り除く。値は 7-Zip 側の名前 */
export async function deleteFromArchive(
  path: string,
  entries: readonly string[],
  options: ModifyOptions = {}
): Promise<void> {
  await run(['d', path, ...entries], options)
}
