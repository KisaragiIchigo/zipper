import { join } from 'node:path'
import { BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron'
import { IPC } from '@shared/ipc'
import { READABLE_EXTENSIONS } from '@shared/archiveFormats'
import { loadSettings } from '../../settings/store'


/** ダイアログを出す親。要求してきた窓に紐づけて、他の窓を巻き込まない */
function parentOf(event: IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

/**
 * 親窓が分かるときはそこへ紐づけ、分からないときは親なしで開く。
 * Electron の showOpenDialog は親の有無で引数の形が変わるため、ここで吸収する。
 */
async function openDialog(
  event: IpcMainInvokeEvent,
  options: Electron.OpenDialogOptions
): Promise<string[]> {
  const parent = parentOf(event)
  const result =
    parent === null ? await dialog.showOpenDialog(options) : await dialog.showOpenDialog(parent, options)
  return result.canceled ? [] : result.filePaths
}

/** 設定に作業フォルダがあれば、ダイアログはそこから開く */
function preferredStart(): string {
  return loadSettings().preferences.workFolder
}

/** ファイルとフォルダを選ばせる一連のダイアログ */
export function registerDialogIpc(): void {
  ipcMain.handle(IPC.archivePick, async (event): Promise<string | null> => {
    const picked = await openDialog(event, {
      title: '書庫を開く',
      properties: ['openFile'],
      filters: [
        { name: '書庫ファイル', extensions: [...READABLE_EXTENSIONS] },
        { name: 'すべてのファイル', extensions: ['*'] }
      ]
    })
    return picked[0] ?? null
  })

  ipcMain.handle(IPC.dialogPickDirectory, async (event, defaultPath: unknown) => {
    const picked = await openDialog(event, {
      title: '展開先のフォルダを選択',
      properties: ['openDirectory', 'createDirectory'],
      ...(typeof defaultPath === 'string' && defaultPath !== ''
        ? { defaultPath }
        : preferredStart() === ''
          ? {}
          : { defaultPath: preferredStart() })
    })
    return picked[0] ?? null
  })

  // Windows ではファイルとフォルダを 1 つのダイアログで同時に選べないため、入口を分ける
  ipcMain.handle(IPC.dialogPickSources, (event): Promise<string[]> =>
    openDialog(event, {
      title: '圧縮するファイルを選択',
      properties: ['openFile', 'multiSelections']
    })
  )

  ipcMain.handle(IPC.dialogPickSourceFolder, async (event): Promise<string | null> => {
    const picked = await openDialog(event, {
      title: '圧縮するフォルダを選択',
      properties: ['openDirectory']
    })
    return picked[0] ?? null
  })

  ipcMain.handle(IPC.dialogSaveArchive, async (event, defaultName: unknown) => {
    const parent = parentOf(event)
    const options: Electron.SaveDialogOptions = {
      title: '書庫の保存先',
      ...(typeof defaultName === 'string' && defaultName !== ''
        ? { defaultPath: join(preferredStart(), defaultName) }
        : {}),
      filters: [
        { name: 'ZIP 書庫', extensions: ['zip'] },
        { name: '7Z 書庫', extensions: ['7z'] },
        { name: 'TAR 書庫', extensions: ['tar'] },
        { name: 'GZIP 書庫', extensions: ['gz', 'tar.gz'] },
        { name: 'BZIP2 書庫', extensions: ['bz2', 'tar.bz2'] },
        { name: 'XZ 書庫', extensions: ['xz', 'tar.xz'] },
        { name: '自己解凍書庫', extensions: ['exe'] }
      ]
    }
    const result =
      parent === null
        ? await dialog.showSaveDialog(options)
        : await dialog.showSaveDialog(parent, options)
    return result.canceled ? null : (result.filePath ?? null)
  })
}
