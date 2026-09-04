import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { shell } from 'electron'
import { extractArchive } from './extractArchive'
import { createTempDirectory } from './tempWorkspace'

export interface OpenEntryOptions {
  /** 7-Zip 側の名前。展開の指定に使う */
  entry: string
  /** 展開後にあるべき名前。エンコーディングを補正した書庫では entry と食い違う */
  displayPath: string
  password?: string
}

/**
 * 書庫の中の 1 件だけを一時領域へ取り出し、関連付けられたアプリで開く。
 * 書庫を丸ごと展開せずに中身を確かめられるようにするための経路。
 */
export async function openArchiveEntry(
  archivePath: string,
  options: OpenEntryOptions
): Promise<void> {
  const destination = await createTempDirectory('view')

  const needsRename = options.entry !== options.displayPath

  try {
    await extractArchive(archivePath, {
      destination,
      entries: [options.entry],
      ...(needsRename ? { renames: [{ from: options.entry, to: options.displayPath }] } : {}),
      ...(options.password === undefined ? {} : { password: options.password })
    })
  } catch (error) {
    // 鍵が違うと、7-Zip は中身を書き込む前に空のファイルだけを残して終わる。
    // 開けなかったものを取っておく意味はないので、その場で片付ける
    await rm(destination, { recursive: true, force: true })
    throw error
  }

  const opened = await shell.openPath(join(destination, options.displayPath))
  if (opened !== '') throw new Error(opened)
}
