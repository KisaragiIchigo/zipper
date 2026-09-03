import { access, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { OverwriteMode } from '@shared/types'

export interface RenamePlan {
  /** 7-Zip が実際に作った、書庫内相対のパス */
  from: string
  /** あるべきパス */
  to: string
}

function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

function parentOf(path: string): string {
  const index = path.lastIndexOf('/')
  return index < 0 ? '' : path.slice(0, index)
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** name.txt が埋まっていれば name_1.txt、name_2.txt と空きを探す */
async function findAvailableName(destination: string, relative: string): Promise<string> {
  const dot = baseName(relative).lastIndexOf('.')
  const parent = parentOf(relative)
  const base = baseName(relative)
  const stem = dot <= 0 ? base : base.slice(0, dot)
  const extension = dot <= 0 ? '' : base.slice(dot)

  for (let index = 1; index < 1000; index++) {
    const candidate = stem + '_' + index + extension
    const full = parent === '' ? candidate : parent + '/' + candidate
    if (!(await exists(join(destination, full)))) return full
  }
  return relative
}

/**
 * 展開後のファイル名を、一覧で見せた名前に合わせる。
 *
 * 7-Zip は自身が解釈したコードページでファイルを書き出すため、こちらが補正した名前とは
 * 食い違うことがある。階層の深いものから処理すれば、親はまだ元の名前のままなので、
 * 各段階では自分の名前だけを差し替えればよい。
 *
 * 7-Zip 側の重複判定は補正前の名前で行われる。補正後の名前で初めて衝突する場合は
 * ここでしか気づけないため、利用者が選んだ扱いをこの段でも適用する。
 */
export async function applyRenames(
  destination: string,
  plans: readonly RenamePlan[],
  mode: OverwriteMode = 'overwrite'
): Promise<void> {
  const pending = plans
    .filter((plan) => plan.from !== plan.to)
    .sort((a, b) => b.from.split('/').length - a.from.split('/').length)

  for (const plan of pending) {
    const parent = parentOf(plan.from)
    const source = join(destination, plan.from)
    if (!(await exists(source))) continue

    let target = parent === '' ? baseName(plan.to) : parent + '/' + baseName(plan.to)

    if (mode !== 'overwrite' && (await exists(join(destination, target)))) {
      if (mode === 'skip') {
        // 7-Zip は補正前の名前で書き出してしまっている。残すと正体不明のごみになる
        await rm(source, { force: true, recursive: true })
        continue
      }
      target = await findAvailableName(destination, target)
    }

    await rename(source, join(destination, target))
  }
}
