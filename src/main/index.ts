import { app, nativeTheme } from 'electron'
import type { LaunchIntent } from '@shared/types'
import { registerIpcHandlers } from './ipc/registerIpcHandlers'
import { applyShellCommand, parseShellCommand } from './shell/applyIntegration'
import { cleanupTempDirectories } from './sevenzip/tempWorkspace'
import { flushSettings, loadSettings } from './settings/store'
import { parseLaunchArgs, queueIntent, takePendingIntent } from './window/launchIntent'
import { dispatchIntent, openWindow } from './window/windowManager'

// インストーラとアンインストーラから、画面を出さずに登録だけを行うために呼ばれる。
// 単一インスタンスの仕組みに乗せると既存の窓へ流れてしまうため、先に分岐する
const shellCommand = parseShellCommand(process.argv, app.isPackaged)

if (shellCommand !== null) {
  void app.whenReady().then(async () => {
    await applyShellCommand(shellCommand)
    app.exit(0)
  })
} else if (!app.requestSingleInstanceLock()) {
  // 2 個目以降の起動は既存のプロセスへ引き渡す。窓はそちらで新しく開かれる。
  // 右クリックの「圧縮」は選択したファイルごとに起動するため、そちらで合流させる
  app.quit()
} else {
  /** 画面を出せるようになる前に届いた要求を溜めておく */
  const queued: LaunchIntent[] = []
  let ready = false
  // 起動引数に要求があるなら、まとめ終わるのを待つ。素の窓を先に開くと余分な窓が残る
  const awaitingInitial = parseLaunchArgs(process.argv, app.isPackaged) !== null

  const handle = (intent: LaunchIntent): void => {
    if (ready) dispatchIntent(intent)
    else queued.push(intent)
  }

  const accept = (argv: readonly string[]): void => {
    const intent = parseLaunchArgs(argv, app.isPackaged)

    // 引数なしの起動は、何も持たない窓をもう 1 つ開くという意味になる
    if (intent === null) {
      if (ready) openWindow()
      return
    }

    queueIntent(intent)
    void takePendingIntent().then((settled) => {
      if (settled !== null) handle(settled)
    })
  }

  app.on('second-instance', (_event, argv) => {
    accept(argv)
  })

  // Renderer の準備前に確定するため、ウィンドウ生成より先に受け取っておく
  accept(process.argv)

  void app.whenReady().then(() => {
    app.setAppUserModelId('dev.stiz.zipper')
    nativeTheme.themeSource = loadSettings().themeMode
    registerIpcHandlers()

    ready = true
    if (queued.length > 0) {
      for (const intent of queued.splice(0)) dispatchIntent(intent)
    } else if (!awaitingInitial) {
      // 引数なしの起動。何も持たない窓を 1 つ開く
      openWindow()
    }
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  // 閲覧のために取り出したファイルは、開いたアプリが手放すまで消せない。終了時にまとめて片付ける
  app.on('will-quit', (event) => {
    event.preventDefault()
    void Promise.all([cleanupTempDirectories(), flushSettings()]).finally(() => app.exit(0))
  })
}
