import type { TaskProgress } from '@shared/types'
import { ArchiveFailure } from './ArchiveFailure'
import { classifyFailure } from './classifyFailure'
import { parseTestFailures } from './parseTestOutput'
import { createProgressReporter } from './progressReporter'
import { resolveSevenZipPath } from './resolveBinary'
import { runSevenZip } from './runSevenZip'

export interface TestOptions {
  password?: string
  onProgress?: (progress: TaskProgress) => void
  /** 全体の件数。進捗の表示に使う */
  total?: number
  signal?: AbortSignal
}

export interface TestReport {
  /** 壊れている項目。空なら問題なし */
  failures: string[]
}

/** 検証は全件を読み直すため時間がかかる */
const IDLE_TIMEOUT_MS = 120_000

/**
 * 書庫の中身を実際に展開してみて、壊れていないかを確かめる。
 * ディスクへは書き出さないため、空き容量を気にせず確認できる。
 */
export async function testArchive(path: string, options: TestOptions = {}): Promise<TestReport> {
  const binary = resolveSevenZipPath()
  const args = ['t', path, '-bsp1', '-bb1']
  if (options.password !== undefined) args.push('-p' + options.password)

  const result = await runSevenZip(binary, args, {
    timeoutMs: IDLE_TIMEOUT_MS,
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    onStdout: createProgressReporter({
      ...(options.total === undefined ? {} : { total: options.total }),
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress })
    })
  })

  const output = result.stdout + result.stderr
  const failures = parseTestFailures(output)

  // 壊れた項目を挙げられたなら、それ自体が結果。開けなかった場合だけ失敗として扱う
  if (result.code !== 0 && failures.length === 0) {
    throw new ArchiveFailure(classifyFailure(output, options.password !== undefined))
  }

  return { failures }
}
