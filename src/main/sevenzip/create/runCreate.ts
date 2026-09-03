import type { TaskProgress } from '@shared/types'
import { ArchiveFailure } from '../ArchiveFailure'
import { classifyFailure } from '../classifyFailure'
import { createProgressReporter } from '../progressReporter'
import { resolveSevenZipPath } from '../resolveBinary'
import { runSevenZip } from '../runSevenZip'

/** 圧縮は展開より長く無応答になりうる */
const IDLE_TIMEOUT_MS = 120_000

export interface RunCreateOptions {
  onProgress?: (progress: TaskProgress) => void
  total?: number
  signal?: AbortSignal
}

/** 7-Zip を 1 回走らせる。失敗は ArchiveFailure として投げ直す */
export async function runCreate(args: string[], options: RunCreateOptions): Promise<void> {
  const result = await runSevenZip(resolveSevenZipPath(), args, {
    timeoutMs: IDLE_TIMEOUT_MS,
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    onStdout: createProgressReporter({
      ...(options.total === undefined ? {} : { total: options.total }),
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress })
    })
  })

  if (result.code !== 0) {
    throw new ArchiveFailure(classifyFailure(result.stdout + result.stderr, false))
  }
}
