import {
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent
} from 'react'
import type { ArchiveEntry } from '@shared/types'

export interface RowSelectionHandlers {
  /** キーボードで今いる行。スクロール位置の追従にも使う */
  focused: number
  handleSelect: (event: ReactMouseEvent, path: string, index: number) => void
  handleKeyDown: (event: ReactKeyboardEvent) => void
}

interface RowSelectionOptions {
  rows: readonly ArchiveEntry[]
  selected: ReadonlySet<string>
  onChange: (next: ReadonlySet<string>) => void
  onOpen: (entry: ArchiveEntry) => void
  onPreview: (entry: ArchiveEntry) => void
  onNavigateUp: () => void
}

/**
 * 一覧の選択と移動。エクスプローラーと同じ作法に合わせる。
 * Ctrl は 1 件ずつの出し入れ、Shift は起点からの範囲、修飾なしは単独選択。
 * 矢印で行を移り、Enter で開き、Backspace で上のフォルダへ戻る。
 */
export function useRowSelection({
  rows,
  selected,
  onChange,
  onOpen,
  onPreview,
  onNavigateUp
}: RowSelectionOptions): RowSelectionHandlers {
  const [anchor, setAnchor] = useState<number | null>(null)
  const [focused, setFocused] = useState(0)

  const selectRange = (from: number, to: number): void => {
    const start = Math.min(from, to)
    const end = Math.max(from, to)
    onChange(new Set(rows.slice(start, end + 1).map((entry) => entry.path)))
  }

  const moveTo = (index: number, extend: boolean): void => {
    const clamped = Math.max(0, Math.min(rows.length - 1, index))
    const target = rows[clamped]
    if (target === undefined) return

    setFocused(clamped)
    if (extend && anchor !== null) {
      selectRange(anchor, clamped)
      return
    }
    onChange(new Set([target.path]))
    setAnchor(clamped)
  }

  const handleSelect = (event: ReactMouseEvent, path: string, index: number): void => {
    setFocused(index)

    if (event.ctrlKey || event.metaKey) {
      const next = new Set(selected)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      onChange(next)
      setAnchor(index)
      return
    }

    if (event.shiftKey && anchor !== null) {
      selectRange(anchor, index)
      return
    }

    onChange(new Set([path]))
    setAnchor(index)
  }

  const handleKeyDown = (event: ReactKeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault()
      onChange(new Set(rows.map((entry) => entry.path)))
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveTo(focused + 1, event.shiftKey)
        return
      case 'ArrowUp':
        event.preventDefault()
        moveTo(focused - 1, event.shiftKey)
        return
      case 'Home':
        event.preventDefault()
        moveTo(0, event.shiftKey)
        return
      case 'End':
        event.preventDefault()
        moveTo(rows.length - 1, event.shiftKey)
        return
      case 'Enter': {
        const target = rows[focused]
        if (target !== undefined) {
          event.preventDefault()
          onOpen(target)
        }
        return
      }
      case ' ': {
        const target = rows[focused]
        if (target !== undefined && !target.isDirectory) {
          event.preventDefault()
          onPreview(target)
        }
        return
      }
      case 'Backspace':
        event.preventDefault()
        onNavigateUp()
        return
      default:
        return
    }
  }

  return { focused, handleSelect, handleKeyDown }
}
