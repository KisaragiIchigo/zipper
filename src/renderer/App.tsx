import { MainApp } from '@/app/MainApp'
import { ProgressApp } from '@/app/ProgressApp'

/**
 * どのように起こされたかで画面を分ける。
 * 解凍のためだけに呼ばれた場合、一覧を出しても使われないため進み具合だけを見せる。
 */
export function App() {
  return window.zipper.launchMode === 'progress' ? <ProgressApp /> : <MainApp />
}
