import type { TitleBarOverlay } from 'electron'

/** タイトルバーの高さ。globals.css の h-titlebar と一致させること */
export const TITLEBAR_HEIGHT = 40

/**
 * Windows 純正のキャプションボタン（Window Controls Overlay）の配色。
 * 自前描画ではなく OS に描かせることで、最大化ボタンのスナップレイアウトが生きる。
 * 値は project_style.json の palette.base_bg / text_primary と一致させる。
 */
export function titleBarOverlayFor(dark: boolean): TitleBarOverlay {
  return dark
    ? { color: '#202020', symbolColor: '#ffffff', height: TITLEBAR_HEIGHT }
    : { color: '#f3f3f3', symbolColor: '#1a1a1a', height: TITLEBAR_HEIGHT }
}
