import type { CreateArchiveRequest, CreateBatchRequest } from '@shared/types'
import type { CompressSettings } from '../useCompress'

/** 対象と宛先を除いた、書庫の作り方の指定 */
type CreateOptions = Omit<CreateArchiveRequest, 'sources' | 'destination'>

/** 自己解凍にするか。7z 以外では選べない */
export function isSelfExtracting(settings: CompressSettings): boolean {
  return settings.format === '7z' && settings.selfExtracting
}

/**
 * 形式ごとに意味を持つ指定だけを残す。
 * 使えない指定をそのまま渡すと、7-Zip 側で解釈が食い違う。
 */
function createOptions(settings: CompressSettings): CreateOptions {
  const sfx = isSelfExtracting(settings)

  return {
    format: settings.format,
    level: settings.level,
    ...(settings.password === '' ? {} : { password: settings.password }),
    ...(settings.format === '7z' ? { encryptHeader: settings.encryptHeader } : {}),
    ...(settings.format === 'zip' ? { zipEncryption: settings.zipEncryption } : {}),
    // 自己解凍は先頭のファイルだけが実行できるため、分割とは併用しない
    ...(sfx ? { selfExtracting: true } : {}),
    ...(settings.volumeSize === '' || sfx ? {} : { volumeSize: settings.volumeSize })
  }
}

/** 対象をまとめて 1 つの書庫にする要求 */
export function buildCreateRequest(
  sources: readonly string[],
  destination: string,
  settings: CompressSettings
): CreateArchiveRequest {
  return { sources: [...sources], destination, ...createOptions(settings) }
}

/** 対象ごとに別々の書庫を作る要求。destination は書庫を並べる場所 */
export function buildBatchRequest(
  sources: readonly string[],
  destination: string,
  settings: CompressSettings
): CreateBatchRequest {
  return { sources: [...sources], destination, ...createOptions(settings) }
}
