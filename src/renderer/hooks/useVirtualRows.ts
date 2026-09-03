import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from 'react'

export interface VirtualWindow {
  /** 描画する最初の行の位置 */
  start: number
  /** 描画する最後の行の次の位置 */
  end: number
  /** 描画範囲を正しい位置へずらす量 */
  offsetY: number
  /** スクロールバーの長さを決めるための全体の高さ */
  totalHeight: number
}

/** 画面外へ余分に描く行数。スクロール中の空白を防ぐ */
const OVERSCAN = 8

/**
 * 固定行高の一覧を仮想化する。
 *
 * 2 万件を素直に描くと 3 秒間メインスレッドが止まることを実測で確認したため、
 * 見えている範囲だけを描く。行の高さが一定である前提に立てば、位置は掛け算で決まり、
 * 計測用の観測子を各行へ張る必要がない。
 */
export function useVirtualRows(
  count: number,
  rowHeight: number,
  scrollRef: RefObject<HTMLElement | null>
): VirtualWindow {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (element === null) return

    const handleScroll = (): void => setScrollTop(element.scrollTop)
    element.addEventListener('scroll', handleScroll, { passive: true })

    const observer = new ResizeObserver(() => {
      setViewportHeight(element.clientHeight)
      setScrollTop(element.scrollTop)
    })
    observer.observe(element)
    setViewportHeight(element.clientHeight)

    return () => {
      element.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [scrollRef])

  // 並べ替えや書庫の切り替えで件数が変わったら先頭へ戻す
  useEffect(() => {
    const element = scrollRef.current
    if (element === null) return
    element.scrollTop = 0
    setScrollTop(0)
  }, [count, scrollRef])

  return useMemo(() => {
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + OVERSCAN * 2
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN)
    const end = Math.min(count, start + visibleCount)

    return {
      start,
      end,
      offsetY: start * rowHeight,
      totalHeight: count * rowHeight
    }
  }, [count, rowHeight, scrollTop, viewportHeight])
}
