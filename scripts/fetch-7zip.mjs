// 同梱用の 7-Zip（7z.exe / 7z.dll）を公式サイトから取得して resources/7zip へ配置する。
// MSI の administrative install（msiexec /a）で展開するため、管理者権限も 7-Zip 自身も不要。
import { execFile } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DEST = join(ROOT, 'resources', '7zip')
const BASE = 'https://www.7-zip.org/a'
// 7z.sfx は自己解凍書庫の土台になる実行部
const WANTED = ['7z.exe', '7z.dll', '7z.sfx', 'License.txt']
/** 遡る上限。7-Zip のリリース間隔は最長でも 1 年程度のため 3 年分あれば十分 */
const MAX_MONTHS_BACK = 36

async function exists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 7-Zip のリリースは YY.MM 形式（7z2501 = 25.01）でファイル名に埋まっている。
 * 公式のダウンロードページは最新版の掲載が遅れることがあるため、
 * ページを信用せず当月から遡って MSI の実体そのものを探す。
 */
async function resolveLatestMsiUrl() {
  const now = new Date()
  let year = now.getUTCFullYear() % 100
  let month = now.getUTCMonth() + 1

  for (let i = 0; i < MAX_MONTHS_BACK; i++) {
    const yy = String(year).padStart(2, '0')
    const mm = String(month).padStart(2, '0')
    const url = `${BASE}/7z${yy}${mm}-x64.msi`

    if (await exists(url)) {
      return { url, version: `${yy}.${mm}` }
    }

    month -= 1
    if (month === 0) {
      month = 12
      year -= 1
    }
  }

  throw new Error('公開されている 7-Zip の MSI を見つけられませんでした')
}

async function findFiles(dir, wanted, found = new Map()) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await findFiles(full, wanted, found)
    } else if (wanted.includes(entry.name) && !found.has(entry.name)) {
      found.set(entry.name, full)
    }
  }
  return found
}

async function main() {
  const { url, version } = await resolveLatestMsiUrl()
  console.log(`7-Zip ${version} を取得します: ${url}`)

  const work = await mkdtemp(join(tmpdir(), 'zipper-7z-'))
  const msiPath = join(work, '7zip.msi')
  const extractDir = join(work, 'extract')

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`MSI の取得に失敗しました (HTTP ${response.status})`)
    await writeFile(msiPath, Buffer.from(await response.arrayBuffer()))

    await mkdir(extractDir, { recursive: true })
    await execFileAsync('msiexec', ['/a', msiPath, '/qn', `TARGETDIR=${extractDir}`])

    const found = await findFiles(extractDir, WANTED)
    const missing = WANTED.filter((name) => !found.has(name))
    if (missing.length > 0) {
      throw new Error(`MSI に想定のファイルがありません: ${missing.join(', ')}`)
    }

    await mkdir(DEST, { recursive: true })
    for (const [name, source] of found) {
      await copyFile(source, join(DEST, name))
      console.log(`  配置: resources/7zip/${name}`)
    }

    console.log(`\n7-Zip ${version} の同梱が完了しました。`)
    console.log('License.txt は LGPL の表示義務があるため、配布物から外さないでください。')
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(`失敗しました: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
