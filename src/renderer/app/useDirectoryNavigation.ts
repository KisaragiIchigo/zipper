import { useCallback, useEffect, useState } from 'react'
import type { ArchiveEntry } from '@shared/types'
import { parentDirectory } from '@/lib/buildDirectoryView'

export interface DirectoryNavigation {
  currentPath: string
  navigate: (path: string) => void
  goUp: () => void
  /** フォルダなら潜り、ファイルなら false を返して呼び出し側へ委ねる */
  enter: (entry: ArchiveEntry) => boolean
}

/**
 * 書庫の中のフォルダをたどる。
 * 別の書庫に切り替わったら最上位へ戻す。
 */
export function useDirectoryNavigation(archivePath: string | null): DirectoryNavigation {
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    setCurrentPath('')
  }, [archivePath])

  const goUp = useCallback(() => {
    setCurrentPath((current) => parentDirectory(current) ?? current)
  }, [])

  const enter = useCallback((entry: ArchiveEntry): boolean => {
    if (!entry.isDirectory) return false
    setCurrentPath(entry.path)
    return true
  }, [])

  return { currentPath, navigate: setCurrentPath, goUp, enter }
}
