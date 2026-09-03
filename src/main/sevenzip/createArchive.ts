import { access, stat } from 'node:fs/promises'
import { FORMAT_TRAITS } from '@shared/archiveFormats'
import type {
  ArchiveFormat,
  CompressionLevel,
  TaskProgress,
  ZipEncryption
} from '@shared/types'
import { buildCreateArgs } from './create/buildCreateArgs'
import { createViaTar } from './create/createViaTar'
import { runCreate } from './create/runCreate'

export interface CreateArchiveOptions {
  format: ArchiveFormat
  level: CompressionLevel
  password?: string
  /** 7z のみ。ファイル名まで暗号化し、一覧の閲覧にもパスワードを要求する */
  encryptHeader?: boolean
  /** zip のみ。既定の ZipCrypto は既知平文攻撃に弱いため AES256 を標準とする */
  zipEncryption?: ZipEncryption
  /** 分割サイズ。7-Zip の記法（100m / 4g など）。未指定なら分割しない */
  volumeSize?: string
  /** 書庫へ入れないファイル名 */
  exclude?: readonly string[]
  onProgress?: (progress: TaskProgress) => void
  /** 全体の件数。進捗の表示に使う */
  total?: number
  signal?: AbortSignal
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** 1 つのファイルしか包めない形式で、TAR を挟む必要があるか */
async function needsTar(
  sources: readonly string[],
  format: ArchiveFormat
): Promise<boolean> {
  if (FORMAT_TRAITS[format].multiFile) return false
  if (sources.length !== 1) return true

  const only = sources[0]
  if (only === undefined) return false
  try {
    return (await stat(only)).isDirectory()
  } catch {
    return false
  }
}

/**
 * 書庫を作成し、実際に生まれたファイルのパスを返す。
 *
 * sources は絶対パスで受け取り、書庫内にはそれぞれの名前で格納される。
 * 分割を指定した場合、7-Zip は指定名そのものではなく連番を付けたファイルを作る。
 */
export async function createArchive(
  sources: readonly string[],
  destination: string,
  options: CreateArchiveOptions
): Promise<string> {
  if (await needsTar(sources, options.format)) {
    await createViaTar(sources, destination, options)
  } else {
    await runCreate(buildCreateArgs(destination, sources, options), {
      ...(options.total === undefined ? {} : { total: options.total }),
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress }),
      ...(options.signal === undefined ? {} : { signal: options.signal })
    })
  }

  if (await exists(destination)) return destination
  const firstVolume = destination + '.001'
  return (await exists(firstVolume)) ? firstVolume : destination
}
