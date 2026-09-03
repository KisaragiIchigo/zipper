import { access, constants } from 'node:fs/promises'
import type { SevenZipProbe } from '@shared/types'
import { parseSevenZipVersion } from './parseVersion'
import { resolveSevenZipPath } from './resolveBinary'
import { runSevenZip } from './runSevenZip'

/** 同梱 7-Zip が存在し、実行できるかを確認する */
export async function probeSevenZip(): Promise<SevenZipProbe> {
  const path = resolveSevenZipPath()

  try {
    await access(path, constants.X_OK)
  } catch {
    return {
      available: false,
      path,
      reason: '7-Zip の実行ファイルが見つかりません。npm run fetch:7zip を実行してください。'
    }
  }

  try {
    // 引数なし起動でバナーとヘルプが出る。終了コードは 0 とは限らないため見ない
    const { stdout, stderr } = await runSevenZip(path, [], { timeoutMs: 10_000 })
    const version = parseSevenZipVersion(stdout) ?? parseSevenZipVersion(stderr)

    if (version === null) {
      return { available: false, path, reason: '7-Zip のバージョンを判別できませんでした。' }
    }
    return { available: true, path, version }
  } catch (error) {
    return {
      available: false,
      path,
      reason: error instanceof Error ? error.message : '7-Zip の起動に失敗しました。'
    }
  }
}
