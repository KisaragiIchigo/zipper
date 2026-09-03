import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createArchive, type CreateArchiveOptions } from './createArchive'
import { resolveSfxModulePath } from './resolveBinary'

/**
 * 自己解凍書庫を作る。
 *
 * 7-Zip の自己解凍は、実行部（7z.sfx）の後ろに 7z 書庫をそのまま連結した形をしている。
 * まず通常の 7z 書庫を一時領域へ作り、実行部と結合して 1 つの exe に仕立てる。
 * 分割との併用はできない（連結した先頭のファイルしか実行できないため）。
 */
export async function createSelfExtracting(
  sources: readonly string[],
  destination: string,
  options: Omit<CreateArchiveOptions, 'format' | 'volumeSize'>
): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'zipper-sfx-'))
  const payload = join(workspace, 'payload.7z')

  try {
    await createArchive(sources, payload, { ...options, format: '7z' })

    const [module, archive] = await Promise.all([
      readFile(resolveSfxModulePath()),
      readFile(payload)
    ])
    await writeFile(destination, Buffer.concat([module, archive]))

    return destination
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
}
