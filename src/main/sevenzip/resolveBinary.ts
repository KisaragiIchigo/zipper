import { join } from 'node:path'
import { app } from 'electron'

/**
 * 同梱 7-Zip の実体パスを返す。
 *
 * 配布時は asar の外（extraResources）へ展開されるため process.resourcesPath を基準にする。
 * 開発時は out/main からの相対で辿る。app.getAppPath() はエントリの置き場所に左右されるため使わない。
 */
function resourceDirectory(): string {
  return app.isPackaged
    ? join(process.resourcesPath, '7zip')
    : join(__dirname, '..', '..', 'resources', '7zip')
}

export function resolveSevenZipPath(): string {
  return join(resourceDirectory(), '7z.exe')
}

/** 自己解凍書庫の先頭に置く実行部 */
export function resolveSfxModulePath(): string {
  return join(resourceDirectory(), '7z.sfx')
}
