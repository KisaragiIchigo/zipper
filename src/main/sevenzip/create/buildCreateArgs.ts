import { FORMAT_TRAITS } from '@shared/archiveFormats'
import type { ArchiveFormat, CompressionLevel, ZipEncryption } from '@shared/types'

export interface CreateArgsInput {
  format: ArchiveFormat
  level: CompressionLevel
  password?: string
  encryptHeader?: boolean
  zipEncryption?: ZipEncryption
  volumeSize?: string
  /** 書庫へ入れないファイル名。7-Zip のパターン記法をそのまま渡す */
  exclude?: readonly string[]
}

/**
 * 7-Zip へ渡す引数を組み立てる。
 * 形式によって使える指定が違うため、性質表に無いものは黙って落とす。
 */
export function buildCreateArgs(
  destination: string,
  sources: readonly string[],
  input: CreateArgsInput
): string[] {
  const traits = FORMAT_TRAITS[input.format]
  const args = [
    'a',
    '-t' + traits.type,
    '-bsp1',
    '-bb1',
    '-y',
    // 名前をパターンとして解釈させない。角括弧を含むファイル名が取りこぼされるため
    '-spd'
  ]

  if (traits.levels) args.push('-mx' + input.level)

  if (traits.password && input.password !== undefined && input.password !== '') {
    args.push('-p' + input.password)
    if (input.format === '7z' && input.encryptHeader === true) args.push('-mhe=on')
    if (input.format === 'zip') args.push('-mem=' + (input.zipEncryption ?? 'AES256'))
  }

  if (input.volumeSize !== undefined && input.volumeSize !== '') {
    args.push('-v' + input.volumeSize)
  }

  // r を付けると階層の途中にあるものも外れる
  for (const pattern of input.exclude ?? []) args.push('-xr!' + pattern)

  args.push(destination, ...sources)
  return args
}
