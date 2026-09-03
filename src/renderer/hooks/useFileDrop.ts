import { useEffect, useState } from 'react'

/**
 * ウィンドウ全体でファイルのドロップを受ける。
 * Electron 32 以降 File.path は廃止されたため、実体のパスは preload 経由で得る。
 */
export function useFileDrop(onDrop: (paths: readonly string[]) => void): boolean {
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault()
      setDragging(true)
    }
    const handleDragLeave = (event: DragEvent): void => {
      // ウィンドウの外へ出たときだけ解除する。子要素をまたぐ移動では relatedTarget が残る
      if (event.relatedTarget === null) setDragging(false)
    }
    const handleDrop = (event: DragEvent): void => {
      event.preventDefault()
      setDragging(false)

      const files = [...(event.dataTransfer?.files ?? [])]
      const paths = files
        .map((file) => window.zipper.archive.pathForFile(file))
        .filter((path) => path !== '')

      if (paths.length > 0) onDrop(paths)
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [onDrop])

  return dragging
}
