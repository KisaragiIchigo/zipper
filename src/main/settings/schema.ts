import { z } from 'zod'

/**
 * 既定で外すファイル。どれも中身ではなく、作った環境の都合で紛れ込むもの。
 * macOS が作る __MACOSX と .DS_Store、Windows が作る Thumbs.db と desktop.ini。
 */
const DEFAULT_EXCLUDES = ['.DS_Store', 'Thumbs.db', '__MACOSX', 'desktop.ini']

const DEFAULT_PREFERENCES = {
  excludePatterns: DEFAULT_EXCLUDES,
  workFolder: '',
  checkUpdateOnStartup: true,
  tooltipEnabled: false,
  tooltipMaxEntries: 5
}

/** 設定画面から変えられる項目。Renderer から届く値でもあるため単独で検証できるようにする */
export const preferencesSchema = z
  .object({
    excludePatterns: z.array(z.string().min(1).max(200)).max(100).default(DEFAULT_EXCLUDES),
    workFolder: z.string().default(''),
    checkUpdateOnStartup: z.boolean().default(true),
    tooltipEnabled: z.boolean().default(false),
    tooltipMaxEntries: z.number().int().min(1).max(50).default(5)
  })
  .default(DEFAULT_PREFERENCES)

/**
 * 設定ファイルは利用者が手で書き換えられる外部入力。
 * 壊れていても起動を止めないよう、値ごとに既定へ落とす。
 */
export const settingsSchema = z.object({
  window: z
    .object({
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      width: z.number().int().min(400).max(10000).default(1180),
      height: z.number().int().min(300).max(10000).default(720),
      maximized: z.boolean().default(false)
    })
    .default({ width: 1180, height: 720, maximized: false }),
  themeMode: z.enum(['system', 'light', 'dark']).default('system'),
  preferences: preferencesSchema
})

export type Settings = z.infer<typeof settingsSchema>
export type WindowSettings = Settings['window']
export type Preferences = Settings['preferences']

export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({})
