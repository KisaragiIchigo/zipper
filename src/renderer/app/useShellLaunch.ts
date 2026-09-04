import { useCallback } from 'react'
import type { ArchiveFormat } from '@shared/types'
import type { CompressController } from '@/hooks/useCompress'
import type { ExtractController } from '@/hooks/useExtract'
import { useLaunchIntent, type ExtractMode } from './useLaunchIntent'

interface ShellLaunchSources {
  open: (paths: readonly string[]) => void
  compress: CompressController
  extract: ExtractController
}

/**
 * シェルの右クリックや起動引数から届いた要求を、実際の操作へ結び付ける。
 * 解凍は選ばれた書庫をそのまま順に処理し、圧縮は形式の指定があればその場で作る。
 */
export function useShellLaunch({ open, compress, extract }: ShellLaunchSources): void {
  const onExtract = useCallback(
    (paths: readonly string[], mode: ExtractMode) => {
      extract.startBatch({ archives: paths, mode })
    },
    [extract]
  )

  const onCompress = useCallback(
    (paths: readonly string[], format: ArchiveFormat | null, separate: boolean) => {
      if (format === null) compress.beginWith(paths)
      else if (separate) compress.compressEachNow(paths, format)
      else compress.compressNow(paths, format)
    },
    [compress]
  )

  useLaunchIntent({ onOpen: (path) => open([path]), onCompress, onExtract })
}
