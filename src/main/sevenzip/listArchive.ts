import type { ArchiveInfo, Codepage, FilenameEncoding } from '@shared/types'
import { readZipFilenames } from '../zip/readZipFilenames'
import { ArchiveFailure } from './ArchiveFailure'
import { classifyFailure } from './classifyFailure'
import { resolveNames } from './listing/resolveNames'
import { toEntry } from './listing/toEntry'
import { parseListing } from './parseListing'
import { resolveSevenZipPath } from './resolveBinary'
import { runSevenZip } from './runSevenZip'
import { resolveFirstVolume } from './volumeSets'

export interface ListOptions {
  /** 指定するとファイル名のコードページ推定を行わず、この値で読む */
  codepage?: Codepage
  /** 暗号化書庫のパスワード。未指定なら 7-Zip はプロンプトに入り、その状態から種類を判別する */
  password?: string
}

/**
 * 書庫の内容を一覧する。
 * 開けなかった場合は ArchiveFailure を投げるので、呼び出し側は kind で分岐する。
 */
export async function listArchive(
  requestedPath: string,
  options: ListOptions = {}
): Promise<ArchiveInfo> {
  // 分割書庫の続きの巻を渡されても、先頭から読み直せば中身が見える
  const path = await resolveFirstVolume(requestedPath)

  const binary = resolveSevenZipPath()
  const args = ['l', '-slt']
  if (options.password !== undefined) args.push('-p' + options.password)
  args.push(path)

  const result = await runSevenZip(binary, args)
  const listing = parseListing(result.stdout)

  // 破損した書庫でも一覧だけは読めることがある。終了コードだけで失敗と決めない
  if (result.code !== 0 && listing.entries.length === 0) {
    throw new ArchiveFailure(
      classifyFailure(result.stdout + result.stderr, options.password !== undefined)
    )
  }

  let encoding: FilenameEncoding | null = null
  let decodedNames: string[] | null = null

  if (listing.type?.toLowerCase() === 'zip') {
    const names = await readZipFilenames(path)

    // 7-Zip の一覧とセントラルディレクトリは同じ順序で並ぶ。
    // 件数が食い違う場合は対応付けの根拠を失うため、7-Zip の結果をそのまま使う
    if (names !== null && names.length === listing.entries.length) {
      const sevenZipNames = listing.entries.map((entry) => entry['Path'] ?? '')
      const resolved = resolveNames(names, sevenZipNames, options.codepage)
      decodedNames = resolved.names
      encoding = resolved.encoding
    }
  }

  const entries = listing.entries.map((raw, index) => toEntry(raw, decodedNames?.[index] ?? null))

  return {
    path,
    type: listing.type ?? 'unknown',
    physicalSize: listing.physicalSize,
    entries,
    encoding,
    hasWarning: result.code !== 0,
    hasEncryptedEntry: entries.some((entry) => entry.encrypted)
  }
}
