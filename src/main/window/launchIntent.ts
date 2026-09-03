import type { LaunchAction, LaunchIntent } from '@shared/types'

/**
 * 右クリックの「圧縮」は選択したファイルごとに別プロセスとして起動する。
 * 到着が散らばるため、最後の到着からこの時間だけ待って 1 つの要求にまとめる。
 */
const COALESCE_MS = 400

let pending: LaunchIntent | null = null
let settleAt = 0

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** 右クリックの各項目が渡してくる指定 */
const ACTION_FLAGS: Readonly<Record<string, LaunchAction>> = {
  '--extract': 'extract',
  '--extract-here': 'extract-here',
  '--extract-to-folder': 'extract-to-folder',
  '--compress': 'compress',
  '--compress-zip': 'compress-zip',
  '--compress-7z': 'compress-7z'
}

/**
 * 起動引数を解釈する。
 * 配布時は argv[0] が実行ファイル、開発時は argv[1] までが electron 自身の引数になる。
 */
export function parseLaunchArgs(argv: readonly string[], packaged: boolean): LaunchIntent | null {
  let action: LaunchAction = 'open'
  const paths: string[] = []

  for (const arg of argv.slice(packaged ? 1 : 2)) {
    const known = ACTION_FLAGS[arg]
    if (known !== undefined) {
      action = known
      continue
    }
    if (arg.startsWith('-')) continue
    paths.push(arg)
  }

  return paths.length === 0 ? null : { action, paths }
}

/** 到着した要求を溜める。同じ操作なら 1 つにまとめる */
export function queueIntent(intent: LaunchIntent): void {
  if (pending !== null && pending.action === intent.action) {
    for (const path of intent.paths) {
      if (!pending.paths.includes(path)) pending.paths.push(path)
    }
  } else {
    pending = { action: intent.action, paths: [...intent.paths] }
  }
  settleAt = Date.now() + COALESCE_MS
}

/** 集約の締め切りまで待ってから、溜まった要求を 1 度だけ返す */
export async function takePendingIntent(): Promise<LaunchIntent | null> {
  let remaining = settleAt - Date.now()
  while (remaining > 0) {
    await delay(remaining)
    remaining = settleAt - Date.now()
  }

  const result = pending
  pending = null
  return result
}
