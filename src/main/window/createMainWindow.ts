import { join } from 'node:path'
import { app, BrowserWindow, nativeTheme, shell } from 'electron'
import { loadSettings } from '../settings/store'
import { cascadeAfter, persistWindowState, restoredBounds } from './windowState'
import { titleBarOverlayFor } from './titleBarOverlay'

const DEV_SERVER_URL = process.env['ELECTRON_RENDERER_URL']

/**
 * 進み具合だけを見せる窓の大きさ。
 * 解凍のためだけに起こされた場合、一覧を出しても使われないため小さく開く。
 */
const PROGRESS_WINDOW = { width: 560, height: 560 }

export interface WindowOptions {
  /** 解凍の進み具合だけを見せる窓として開く */
  progressOnly?: boolean
  /** 直前に開いた窓の位置。重ならないよう一段ずらして開く */
  after?: Electron.Rectangle | null
}

export function createMainWindow(options: WindowOptions = {}): BrowserWindow {
  const dark = nativeTheme.shouldUseDarkColors
  const saved = loadSettings().window
  const progressOnly = options.progressOnly === true

  const size = progressOnly ? PROGRESS_WINDOW : { width: saved.width, height: saved.height }
  const base = progressOnly ? PROGRESS_WINDOW : restoredBounds(saved)

  const win = new BrowserWindow({
    ...cascadeAfter(options.after ?? null, base, size),
    minWidth: progressOnly ? 380 : 760,
    minHeight: progressOnly ? 320 : 440,
    show: false,
    backgroundColor: dark ? '#202020' : '#f3f3f3',
    // 配布時は実行ファイルに埋め込まれる。開発時だけ明示的に読ませる
    ...(app.isPackaged ? {} : { icon: join(__dirname, '..', '..', 'build', 'icon.png') }),
    titleBarStyle: 'hidden',
    titleBarOverlay: titleBarOverlayFor(dark),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // 描き始める前に判断できるよう、開き方を引数で渡す
      additionalArguments: ['--zipper-mode=' + (progressOnly ? 'progress' : 'normal')],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  // 進み具合だけの窓は、大きさを覚える対象にしない
  if (!progressOnly) {
    if (saved.maximized) win.maximize()
    persistWindowState(win)
  }
  win.once('ready-to-show', () => win.show())

  // アプリ内で外部サイトを開かせない。http(s) のみ既定ブラウザへ渡す
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (DEV_SERVER_URL !== undefined) {
    void win.loadURL(DEV_SERVER_URL)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
