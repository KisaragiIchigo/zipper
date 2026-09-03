import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createTempDirectory } from './tempWorkspace'

/**
 * これを超えたらファイル経由で渡す。
 * Windows のコマンドラインは 32767 文字までで、それを超えると起動そのものが失敗する。
 * 余裕を見てこの長さで切り替える。
 */
const INLINE_LIMIT = 8000

export interface EntryArguments {
  /** 7-Zip に渡す引数。名前そのものか、リストファイルの指定 */
  args: string[]
  /** 使い終わったら呼ぶ。リストファイルを作らなかった場合は何もしない */
  cleanup: () => Promise<void>
}

/**
 * 取り出す名前を 7-Zip へ渡せる形にする。
 *
 * 数千件を選ぶとコマンドラインの長さの上限に当たるため、
 * その場合は一覧をファイルに書いて場所だけを渡す。
 */
export async function buildEntryArguments(
  entries: readonly string[]
): Promise<EntryArguments> {
  if (entries.length === 0) return { args: [], cleanup: async () => undefined }

  const inlineLength = entries.reduce((total, entry) => total + entry.length + 3, 0)
  if (inlineLength <= INLINE_LIMIT) {
    return { args: [...entries], cleanup: async () => undefined }
  }

  const directory = await createTempDirectory('list')
  const listPath = join(directory, 'entries.txt')
  await writeFile(listPath, entries.join('\r\n'), 'utf8')

  return {
    // リストファイルの中身も UTF-8 として読ませる
    args: ['-scsUTF-8', '@' + listPath],
    cleanup: () => rm(directory, { recursive: true, force: true })
  }
}
