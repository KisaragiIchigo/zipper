import { execFile } from 'node:child_process'
import { rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * .reg ファイルを書き出して取り込む。
 *
 * reg.exe へ値を直接渡す方式だと、コマンド文字列に含まれる引用符のエスケープが
 * Windows の引数解析と二重に絡んで壊れやすい。ファイル経由なら書式が一つに定まる。
 * 日本語のメニュー名を含むため UTF-16LE の BOM 付きで書き出す。
 */
export async function importRegistry(content: string): Promise<void> {
  const file = join(tmpdir(), 'zipper-shell-' + Date.now() + '.reg')
  try {
    await writeFile(file, '\ufeff' + content, 'utf16le')
    await execFileAsync('reg', ['import', file], { windowsHide: true })
  } finally {
    await rm(file, { force: true })
  }
}

/** レジストリキーの有無。存在しなければ reg.exe が非 0 で終わる */
export async function keyExists(key: string): Promise<boolean> {
  try {
    await execFileAsync('reg', ['query', key], { windowsHide: true })
    return true
  } catch {
    return false
  }
}
