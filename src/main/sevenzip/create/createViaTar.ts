import { randomBytes } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import type { TaskProgress } from '@shared/types'
import { buildCreateArgs, type CreateArgsInput } from './buildCreateArgs'
import { runCreate } from './runCreate'
import { scaleProgress } from '../scaleProgress'

/** まとめる工程が全体に占める割合。詰める工程より速いため小さめに取る */
const TAR_SHARE = 40

/** 詰めるだけの拡張子。TAR の名前を決めるために取り除く */
const PACK_EXTENSION = /\.(gz|bz2|xz)$/i

export interface ViaTarOptions extends CreateArgsInput {
  onProgress?: (progress: TaskProgress) => void
  total?: number
  signal?: AbortSignal
}

/**
 * 中間 TAR の名前を決める。
 * この名前がそのまま書庫の中身として見えるため、書き出し先の名前に合わせる。
 */
function stageTarName(destination: string): string {
  const stripped = basename(destination).replace(PACK_EXTENSION, '')
  return stripped.toLowerCase().endsWith('.tar') ? stripped : stripped + '.tar'
}

/**
 * GZIP や XZ のように 1 つのファイルしか包めない形式のために、
 * いったん TAR へまとめてから詰める。
 *
 * 中間の TAR は書き出し先と同じ場所に作る。別のドライブに置くと、
 * 大きな書庫でそのまま一時領域を使い切ってしまうため。
 */
export async function createViaTar(
  sources: readonly string[],
  destination: string,
  options: ViaTarOptions
): Promise<void> {
  const workDir = join(dirname(destination), '.zipper-' + randomBytes(4).toString('hex'))
  const stage = join(workDir, stageTarName(destination))
  const tarProgress = scaleProgress(options.onProgress, 0, TAR_SHARE)
  const packProgress = scaleProgress(options.onProgress, TAR_SHARE, 100)

  await mkdir(workDir, { recursive: true })
  try {
    await runCreate(buildCreateArgs(stage, sources, { ...options, format: 'tar' }), {
      ...(options.total === undefined ? {} : { total: options.total }),
      ...(options.signal === undefined ? {} : { signal: options.signal }),
      ...(tarProgress === undefined ? {} : { onProgress: tarProgress })
    })

    await runCreate(buildCreateArgs(destination, [stage], options), {
      ...(options.signal === undefined ? {} : { signal: options.signal }),
      ...(packProgress === undefined ? {} : { onProgress: packProgress })
    })
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}
