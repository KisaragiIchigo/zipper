import { BrowserWindow, type Rectangle, type WebContents } from 'electron'
import type { LaunchIntent } from '@shared/types'
import { createMainWindow } from './createMainWindow'

/**
 * 窓ごとに、その窓が引き取るべき起動要求。
 *
 * Renderer は描き始めたあとに取りに来る。どの窓が何を担当するかは
 * 窓を作った側にしか分からないため、ここで対応づけて預かる。
 */
const pending = new Map<number, LaunchIntent>()

/** 直前に開いた窓の位置。次の窓を重ねずに開くための起点 */
let lastBounds: Rectangle | null = null

/** 解凍だけを頼まれた窓は、一覧を持たず進み具合だけを見せる */
function isExtract(intent: LaunchIntent | null): boolean {
  return intent !== null && intent.action.startsWith('extract')
}

/** 窓を 1 つ開き、その窓が引き取る要求を預ける */
export function openWindow(intent: LaunchIntent | null = null): BrowserWindow {
  const win = createMainWindow({ progressOnly: isExtract(intent), after: lastBounds })
  const id = win.webContents.id
  lastBounds = win.getBounds()

  if (intent !== null) pending.set(id, intent)
  win.webContents.once('destroyed', () => pending.delete(id))
  // すべて閉じたら段を最初から数え直す
  win.once('closed', () => {
    if (BrowserWindow.getAllWindows().every((other) => other.isDestroyed())) lastBounds = null
  })
  return win
}

/** その窓に割り当てられた要求を 1 度だけ返す */
export function takePendingFor(contents: WebContents): LaunchIntent | null {
  const found = pending.get(contents.id) ?? null
  pending.delete(contents.id)
  return found
}

/**
 * 起動要求を窓へ配る。
 *
 * 書庫を開く要求は 1 つにつき 1 窓を割り当てる。タブで重ねるより、
 * 窓を並べたほうが 2 つの書庫を見比べやすいため。
 * 解凍と圧縮はまとめて 1 つの作業なので、窓も 1 つで足りる。
 */
export function dispatchIntent(intent: LaunchIntent): void {
  if (intent.action !== 'open') {
    openWindow(intent)
    return
  }

  for (const path of intent.paths) openWindow({ action: 'open', paths: [path] })
}

/** すでに開いている窓のうち、手前に出せるものを 1 つ返す */
export function anyWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows().find((win) => !win.isDestroyed()) ?? null
}

/** いま窓が 1 つも開いていないか。起動直後の判断に使う */
export function hasNoWindow(): boolean {
  return anyWindow() === null
}
