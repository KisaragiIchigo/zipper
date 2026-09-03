import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import { DEFAULT_SETTINGS, settingsSchema, type Settings } from './schema'

/** 書き込みが集中しないよう、最後の変更からこの時間だけ待ってまとめる */
const FLUSH_DELAY_MS = 500

let cache: Settings | null = null
let flushTimer: NodeJS.Timeout | null = null

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

/** 起動時に 1 度だけ読む。以降はメモリ上の値を正とする */
export function loadSettings(): Settings {
  if (cache !== null) return cache

  try {
    const parsed = settingsSchema.safeParse(JSON.parse(readFileSync(settingsPath(), 'utf8')))
    cache = parsed.success ? parsed.data : DEFAULT_SETTINGS
  } catch {
    // 初回起動や破損時は既定で始める
    cache = DEFAULT_SETTINGS
  }
  return cache
}

/** 変更を反映する。ファイルへの書き出しはまとめて後追いで行う */
export function updateSettings(patch: Partial<Settings>): void {
  cache = { ...loadSettings(), ...patch }

  if (flushTimer !== null) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    void writeFile(settingsPath(), JSON.stringify(cache, null, 2), 'utf8').catch(() => {
      // 保存できなくても操作は続けられる。次の変更で再挑戦する
    })
  }, FLUSH_DELAY_MS)
}

/** 終了前に、待機中の書き出しを取りこぼさない */
export async function flushSettings(): Promise<void> {
  if (flushTimer === null) return
  clearTimeout(flushTimer)
  flushTimer = null
  await writeFile(settingsPath(), JSON.stringify(cache, null, 2), 'utf8').catch(() => {})
}
