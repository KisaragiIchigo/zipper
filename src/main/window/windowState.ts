import { screen, type BrowserWindow, type Rectangle } from 'electron'
import { updateSettings } from '../settings/store'
import type { WindowSettings } from '../settings/schema'

/** 位置と大きさの保存が連続しないよう、落ち着くまで待つ */
const SAVE_DELAY_MS = 500

/**
 * 保存された位置がいまの画面構成に収まるかを確かめる。
 * 外付けモニタを外した後などに、見えない場所へウィンドウが出るのを防ぐ。
 */
function isOnScreen(bounds: Rectangle): boolean {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea
    return (
      bounds.x < area.x + area.width &&
      bounds.x + bounds.width > area.x &&
      bounds.y < area.y + area.height &&
      bounds.y + bounds.height > area.y
    )
  })
}

/** 段をずらす幅。Windows の重ねて表示に合わせる */
const CASCADE_STEP = 28

/**
 * ウィンドウ全体が 1 つの画面に収まるか。
 * 段をずらし続けて画面からはみ出す手前で、元の位置へ戻すための判定。
 */
function fitsInWorkArea(bounds: Rectangle): boolean {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea
    return (
      bounds.x >= area.x &&
      bounds.y >= area.y &&
      bounds.x + bounds.width <= area.x + area.width &&
      bounds.y + bounds.height <= area.y + area.height
    )
  })
}

/**
 * 直前に開いた窓から一段ずらした位置を返す。
 *
 * 同じ場所に重ねると下の窓が完全に隠れ、開いたことに気づけない。
 * ずらし続けて画面からはみ出す手前まで来たら、元の位置から段を作り直す。
 */
export function cascadeAfter(
  previous: Rectangle | null,
  base: Partial<Rectangle>,
  size: { width: number; height: number }
): Partial<Rectangle> {
  if (previous === null) return base

  const next = { x: previous.x + CASCADE_STEP, y: previous.y + CASCADE_STEP, ...size }
  return fitsInWorkArea(next) ? next : base
}

/** 保存された設定から、生成時に渡せる位置と大きさを組み立てる */
export function restoredBounds(saved: WindowSettings): Partial<Rectangle> {
  const size = { width: saved.width, height: saved.height }
  if (saved.x === undefined || saved.y === undefined) return size

  const candidate = { x: saved.x, y: saved.y, ...size }
  return isOnScreen(candidate) ? candidate : size
}

/** 位置と大きさの変化を追いかけて保存する */
export function persistWindowState(win: BrowserWindow): void {
  let timer: NodeJS.Timeout | null = null

  const save = (): void => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (win.isDestroyed()) return

      // 最大化中でも、解除したときの大きさを覚えておきたい
      const bounds = win.getNormalBounds()
      updateSettings({
        window: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          maximized: win.isMaximized()
        }
      })
    }, SAVE_DELAY_MS)
  }

  win.on('resize', save)
  win.on('move', save)
  win.on('maximize', save)
  win.on('unmaximize', save)
}
